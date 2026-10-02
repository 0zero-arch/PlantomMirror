import { Inject } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AiTasksService } from '../ai-tasks/ai-tasks.service.js';
import { HAIRSTYLE_PROVIDER, type HairstyleProvider } from '../ai/hairstyle-provider.interface.js';
import { AiTaskType } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AI_TASK_QUEUE } from '../queue/queue.module.js';
import { StorageService } from '../storage/storage.service.js';
import { ANALYSIS_JOB } from './appearance.service.js';

interface AnalysisJobData {
  taskId: string;
  photoId: string;
  userId: string;
}

/**
 * 分析任务的队列处理器。
 *
 * 关于「重试」与状态机的配合（这块容易踩坑，写清楚）：
 * BullMQ 重试时会把同一个 job 再跑一遍。如果在第一次失败就把任务标成
 * FAILED，重试开始时状态机会拒绝 FAILED -> PROCESSING 这个转移，于是
 * 重试反而制造出一个更奇怪的错误。
 *
 * 所以这里只在**最后一次尝试**失败时才落 FAILED；中间的失败保持
 * PROCESSING（语义上也对：这个任务确实还在被处理）。真正耗尽重试后
 * 才终态失败，客户端轮询才会看到 FAILED。
 *
 * 这条规则属于架构文档 §11 留给创始人的「重试策略」议题 —— 想改
 * 重试次数就改 createAnalysisTask 里的 attempts，想改语义就改这里。
 */
@Processor(AI_TASK_QUEUE)
export class AnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalysisProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiTasks: AiTasksService,
    private readonly storage: StorageService,
    @Inject(HAIRSTYLE_PROVIDER) private readonly provider: HairstyleProvider,
  ) {
    super();
  }

  async process(job: Job<AnalysisJobData>): Promise<void> {
    if (job.name !== ANALYSIS_JOB) return;

    const { taskId, photoId } = job.data;
    const startedAt = Date.now();

    const task = await this.aiTasks.findByIdOrFail(taskId);
    // 任务可能已被取消（用户中途放弃）。别浪费一次 AI 调用。
    if (task.status === 'CANCELLED' || task.status === 'SUCCESS') {
      this.logger.debug(`跳过已终结的任务 task=${taskId} status=${task.status}`);
      return;
    }

    await this.aiTasks.markProcessing(taskId);

    try {
      const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
      if (!photo) throw new Error(`照片不存在：${photoId}`);

      // 供应商需要能下载到这张图。这里签一个短效地址给它，
      // 有效期不宜太长 —— 它只是个交接凭证。
      const imageUrl = await this.storage.createDownloadUrl(photo.storageKey, 600);

      const input = {
        storageKey: photo.storageKey,
        imageUrl,
        contentType: photo.mimeType ?? undefined,
      };

      // 两次调用可以并行：它们互不依赖，串行只会白白多等一个来回
      const [hair, face] = await Promise.all([
        this.provider.analyzeHair(input),
        this.provider.analyzeFace(input),
      ]);

      // 一张照片一份画像：重复分析用 upsert 覆盖，而不是插出第二份
      await this.prisma.appearanceProfile.upsert({
        where: { photoId },
        create: {
          photoId,
          faceShape: face.faceShape,
          hairType: hair.hairType,
          hairLength: hair.hairLength,
          hairDensity: hair.hairDensity,
          hairFrizziness: hair.hairFrizziness,
          provider: this.provider.name,
          raw: { hair: hair.raw, face: face.raw } as object,
        },
        update: {
          faceShape: face.faceShape,
          hairType: hair.hairType,
          hairLength: hair.hairLength,
          hairDensity: hair.hairDensity,
          hairFrizziness: hair.hairFrizziness,
          provider: this.provider.name,
          raw: { hair: hair.raw, face: face.raw } as object,
        },
      });

      await this.aiTasks.markSuccess(taskId, { provider: this.provider.name });
      await this.aiTasks.recordUsage({
        provider: this.provider.name,
        taskType: AiTaskType.ANALYSIS,
        latencyMs: Date.now() - startedAt,
        success: true,
      });

      this.logger.log(`分析完成 task=${taskId} 耗时=${Date.now() - startedAt}ms`);
    } catch (error) {
      await this.aiTasks.recordUsage({
        provider: this.provider.name,
        taskType: AiTaskType.ANALYSIS,
        latencyMs: Date.now() - startedAt,
        success: false,
      });

      // 只有最后一次尝试失败才落终态，理由见类注释
      const attemptsAllowed = job.opts.attempts ?? 1;
      const isFinalAttempt = job.attemptsMade + 1 >= attemptsAllowed;

      if (isFinalAttempt) {
        await this.aiTasks.markFailed(taskId, error);
        this.logger.error(`分析最终失败 task=${taskId}：${(error as Error).message}`);
      } else {
        this.logger.warn(
          `分析第 ${job.attemptsMade + 1}/${attemptsAllowed} 次尝试失败，将重试 task=${taskId}：${(error as Error).message}`,
        );
      }

      // 抛出去让 BullMQ 按 backoff 重试
      throw error;
    }
  }
}