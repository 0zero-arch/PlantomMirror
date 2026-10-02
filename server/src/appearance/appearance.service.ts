import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { AiTasksService } from '../ai-tasks/ai-tasks.service.js';
import { AppError } from '../common/errors/app-error.js';
import { AiTaskStatus, AiTaskType } from '../generated/prisma/enums.js';
import type { AppearanceProfileModel, AiTaskModel, UserModel } from '../generated/prisma/models.js';
import { PhotosService } from '../photos/photos.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AI_TASK_QUEUE } from '../queue/queue.module.js';

export const ANALYSIS_JOB = 'analysis';

@Injectable()
export class AppearanceService {
  private readonly logger = new Logger(AppearanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly photos: PhotosService,
    private readonly aiTasks: AiTasksService,
    @InjectQueue(AI_TASK_QUEUE) private readonly queue: Queue,
  ) {}

  /**
   * 创建分析任务。
   *
   * 幂等性：同一张照片已有在途任务时**直接返回那个任务**，而不是新建或报错。
   * 理由很实际 —— 手机网络不稳定，客户端重试是常态；报错会让用户看到
   * 莫名其妙的失败，新建则会浪费一次 AI 调用（真接入后就是真金白银）。
   */
  async createAnalysisTask(
    user: UserModel,
    photoId: string,
  ): Promise<{ taskId: string; status: AiTaskStatus }> {
    const photo = await this.photos.findReadyOrFail(user, photoId);

    const inFlight = await this.findInFlightTask(photoId);
    if (inFlight) {
      this.logger.debug(`复用进行中的分析任务 photo=${photoId} task=${inFlight.id}`);
      return { taskId: inFlight.id, status: inFlight.status };
    }

    const task = await this.aiTasks.create({
      type: AiTaskType.ANALYSIS,
      provider: 'pending', // 入队后由处理器按实际 provider 覆盖
      payload: { photoId, userId: user.id, storageKey: photo.storageKey },
    });

    await this.queue.add(
      ANALYSIS_JOB,
      { taskId: task.id, photoId, userId: user.id },
      {
        // 让失败的任务有个上限，避免坏输入把队列堵死
        attempts: 2,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: 500,
        removeOnFail: 1000,
      },
    );

    const queued = await this.aiTasks.markQueued(task.id);
    this.logger.log(`分析任务已入队 task=${task.id} photo=${photoId}`);
    return { taskId: queued.id, status: queued.status };
  }

  /**
   * 查询分析任务。返回体对齐客户端 ApiEndpoints 的预期。
   */
  async getTask(
    user: UserModel,
    taskId: string,
  ): Promise<{ taskId: string; status: AiTaskStatus; error?: string | null; profile?: unknown }> {
    const task = await this.aiTasks.findByIdOrFail(taskId);

    const payload = task.payload as { userId?: string } | null;
    if (payload?.userId && payload.userId !== user.id) {
      // 同 findOwnedOrFail：不暴露「这个任务存在但不属于你」
      throw new AppError('TASK_NOT_FOUND');
    }

    if (task.status !== AiTaskStatus.SUCCESS) {
      return { taskId: task.id, status: task.status, error: task.error };
    }

    const profile = await this.prisma.appearanceProfile.findUnique({
      where: { photoId: (task.payload as { photoId: string }).photoId },
    });

    return {
      taskId: task.id,
      status: task.status,
      profile: profile ? toProfileView(profile) : undefined,
    };
  }

  private findInFlightTask(photoId: string): Promise<AiTaskModel | null> {
    // payload 是 JSONB。用 JSON 路径过滤能直接在库层面筛出这张照片的在途任务，
    // 不必把所有任务捞进内存再过滤。
    return this.prisma.aiTask.findFirst({
      where: {
        type: AiTaskType.ANALYSIS,
        status: {
          in: [AiTaskStatus.CREATED, AiTaskStatus.QUEUED, AiTaskStatus.PROCESSING],
        },
        payload: { path: ['photoId'], equals: photoId },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

/**
 * 对外暴露的画像视图。
 *
 * 刻意**不下发 raw 字段** —— 那是供应商原始响应，可能包含内部置信度、
 * 模型版本等信息，不适合直接给客户端，也避免客户端依赖上游细节。
 * 同时措辞上避免绝对化（架构文档 §6：这些值是第三方 AI 的输出，
 * 不代表绝对真实的人体属性）。
 */
export function toProfileView(profile: AppearanceProfileModel) {
  return {
    profileId: profile.id,
    faceShape: profile.faceShape,
    hairType: profile.hairType,
    hairLength: profile.hairLength,
    hairDensity: profile.hairDensity,
    hairFrizziness: profile.hairFrizziness,
    provider: profile.provider,
  };
}