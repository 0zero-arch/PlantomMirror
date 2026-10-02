import { Inject } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { HAIRSTYLE_PROVIDER, type HairstyleProvider } from '../ai/hairstyle-provider.interface.js';
import { AiTasksService } from '../ai-tasks/ai-tasks.service.js';
import { isAppError } from '../common/errors/app-error.js';
import { AiTaskStatus, AiTaskType } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AI_TASK_QUEUE } from '../queue/queue.module.js';
import { StorageService } from '../storage/storage.service.js';
import { SIMULATION_JOB } from './simulations.service.js';

interface SimulationJobData {
  taskId: string;
  simulationId: string;
}

const EXT_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/** 源图预签名有效期：够供应商拉取即可，不必太长。 */
const SOURCE_URL_TTL_SECONDS = 900;

@Processor(AI_TASK_QUEUE)
export class SimulationProcessor extends WorkerHost {
  private readonly logger = new Logger(SimulationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiTasks: AiTasksService,
    private readonly storage: StorageService,
    @Inject(HAIRSTYLE_PROVIDER) private readonly provider: HairstyleProvider,
  ) {
    super();
  }

  async process(job: Job<SimulationJobData>): Promise<void> {
    if (job.name !== SIMULATION_JOB) return;

    const { taskId, simulationId } = job.data;

    // BullMQ 可能重投递；已终态的任务直接跳过，保证至少一次投递不会变成重复生成。
    const task = await this.aiTasks.findByIdOrFail(taskId);
    if (task.status === AiTaskStatus.SUCCESS || task.status === AiTaskStatus.CANCELLED) {
      this.logger.debug(`跳过已终态任务 task=${taskId} status=${task.status}`);
      return;
    }

    await this.aiTasks.markProcessing(taskId);

    try {
      const simulation = await this.prisma.simulation.findUniqueOrThrow({
        where: { id: simulationId },
        include: { photo: true, hairstyle: true, appearanceProfile: true },
      });

      const sourceUrl = await this.storage.createDownloadUrl(
        simulation.photo.storageKey,
        SOURCE_URL_TTL_SECONDS,
      );

      const appearance = simulation.appearanceProfile
        ? {
            faceShape: simulation.appearanceProfile.faceShape ?? undefined,
            hairType: simulation.appearanceProfile.hairType ?? undefined,
            hairLength: simulation.appearanceProfile.hairLength ?? undefined,
            hairDensity: simulation.appearanceProfile.hairDensity ?? undefined,
            hairFrizziness: simulation.appearanceProfile.hairFrizziness ?? undefined,
          }
        : undefined;

      const result = await this.provider.generateHairstyle({
        source: {
          storageKey: simulation.photo.storageKey,
          imageUrl: sourceUrl,
          contentType: simulation.photo.mimeType ?? undefined,
        },
        providerStyleId: simulation.hairstyle.providerStyleId ?? undefined,
        hairstyleName: simulation.hairstyle.name,
        appearance,
      });

      const ext = EXT_BY_CONTENT_TYPE[result.contentType] ?? '.png';
      const outputKey = `simulations/${simulation.userId}/${simulation.id}${ext}`;

      await this.storage.putObject(outputKey, result.image, result.contentType);

      await this.prisma.$transaction([
        this.prisma.simulation.update({
          where: { id: simulation.id },
          data: { outputStorageKey: outputKey, completedAt: new Date() },
        }),
        this.prisma.aiTask.update({
          where: { id: taskId },
          data: { provider: this.provider.name },
        }),
      ]);

      await this.aiTasks.markSuccess(taskId);
      await this.aiTasks.recordUsage({
        provider: this.provider.name,
        taskType: AiTaskType.SIMULATION,
        latencyMs: result.usage.latencyMs,
        estimatedCost: result.usage.estimatedCost,
        inputSize: result.usage.inputBytes,
        outputSize: result.image.byteLength,
        model: result.usage.model,
        success: true,
      });

      this.logger.log(
        `模拟完成 simulation=${simulation.id} 耗时=${result.usage.latencyMs}ms 输出=${outputKey}`,
      );
    } catch (error) {
      // 与分析任务同一条规矩：只有最后一次尝试才落 FAILED。
      // 提前落 FAILED 会让 BullMQ 的重试撞上 FAILED→PROCESSING 这个非法跃迁。
      const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      const message = describeError(error);

      if (isLastAttempt) {
        await this.aiTasks.markFailed(taskId, message);
        await this.aiTasks.recordUsage({
          provider: this.provider.name,
          taskType: AiTaskType.SIMULATION,
          latencyMs: 0,
          success: false,
        });
        this.logger.error(`模拟最终失败 simulation=${simulationId}：${message}`);
      } else {
        this.logger.warn(
          `模拟第 ${job.attemptsMade + 1} 次尝试失败，等待重试 simulation=${simulationId}：${message}`,
        );
      }

      throw error;
    }
  }
}

function describeError(error: unknown): string {
  if (isAppError(error)) return `${error.code}：${error.message}`;
  if (error instanceof Error) return error.message;
  return String(error);
}