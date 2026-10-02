import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { AiTasksService } from '../ai-tasks/ai-tasks.service.js';
import { AppError } from '../common/errors/app-error.js';
import { AiTaskStatus, AiTaskType } from '../generated/prisma/enums.js';
import type { SimulationModel, UserModel } from '../generated/prisma/models.js';
import { HairstylesService } from '../hairstyles/hairstyles.service.js';
import { PhotosService } from '../photos/photos.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AI_TASK_QUEUE } from '../queue/queue.module.js';
import { StorageService } from '../storage/storage.service.js';

export const SIMULATION_JOB = 'simulation';

export interface SimulationView {
  simulationId: string;
  status: AiTaskStatus;
  hairstyleId: string;
  /** 结果图地址；未完成时为 null。桶是私有的，所以是预签名地址。 */
  outputImageUrl: string | null;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

@Injectable()
export class SimulationsService {
  private readonly logger = new Logger(SimulationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly photos: PhotosService,
    private readonly hairstyles: HairstylesService,
    private readonly aiTasks: AiTasksService,
    private readonly storage: StorageService,
    @InjectQueue(AI_TASK_QUEUE) private readonly queue: Queue,
  ) {}

  /**
   * 创建模拟任务。
   *
   * 幂等规则与分析任务一致，但去重键是 (照片, 发型) 这一对：
   * 同一张照片试不同发型是不同任务，试同一个发型重复提交则复用。
   * 这对用户体感很关键 —— 反复点「再试一次」不应该反复扣钱。
   */
  async create(
    user: UserModel,
    params: { photoId: string; hairstyleId: string; appearanceProfileId?: string },
  ): Promise<{ simulationId: string; taskId: string; status: AiTaskStatus }> {
    const photo = await this.photos.findReadyOrFail(user, params.photoId);
    const hairstyle = await this.hairstyles.findActiveOrFail(params.hairstyleId);

    const existing = await this.prisma.simulation.findFirst({
      where: {
        userId: user.id,
        photoId: photo.id,
        hairstyleId: hairstyle.id,
        aiTask: {
          status: { in: [AiTaskStatus.CREATED, AiTaskStatus.QUEUED, AiTaskStatus.PROCESSING] },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: { aiTask: true },
    });

    if (existing) {
      this.logger.debug(`复用进行中的模拟 simulation=${existing.id}`);
      return {
        simulationId: existing.id,
        taskId: existing.aiTaskId,
        status: existing.aiTask.status,
      };
    }

    // 画像优先用调用方指定的，其次自动取这张照片已有的那份。
    // 允许完全没有画像：试戴不该被「必须先做分析」卡住。
    const profileId =
      params.appearanceProfileId ??
      (await this.prisma.appearanceProfile.findUnique({ where: { photoId: photo.id } }))?.id ??
      null;

    const task = await this.aiTasks.create({
      type: AiTaskType.SIMULATION,
      provider: 'pending',
      payload: { photoId: photo.id, hairstyleId: hairstyle.id, userId: user.id },
    });

    const simulation = await this.prisma.simulation.create({
      data: {
        userId: user.id,
        photoId: photo.id,
        hairstyleId: hairstyle.id,
        appearanceProfileId: profileId,
        aiTaskId: task.id,
      },
    });

    await this.queue.add(
      SIMULATION_JOB,
      { taskId: task.id, simulationId: simulation.id },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 500,
        removeOnFail: 1000,
      },
    );

    const queued = await this.aiTasks.markQueued(task.id);
    this.logger.log(`模拟任务已入队 simulation=${simulation.id} task=${task.id}`);

    return { simulationId: simulation.id, taskId: queued.id, status: queued.status };
  }

  /**
   * 查询模拟结果。
   *
   * 状态从 ai_tasks 读，**不在 simulations 表里存第二份** ——
   * 两处状态不一致是最难排查的一类 bug（架构文档 §7 明确要求）。
   */
  async getView(user: UserModel, simulationId: string): Promise<SimulationView> {
    const simulation = await this.findOwnedOrFail(user, simulationId);

    const task = await this.prisma.aiTask.findUniqueOrThrow({
      where: { id: simulation.aiTaskId },
    });

    const outputImageUrl =
      task.status === AiTaskStatus.SUCCESS && simulation.outputStorageKey
        ? await this.storage.createDownloadUrl(simulation.outputStorageKey)
        : null;

    return {
      simulationId: simulation.id,
      status: task.status,
      hairstyleId: simulation.hairstyleId,
      outputImageUrl,
      error: task.error,
      createdAt: simulation.createdAt,
      completedAt: simulation.completedAt,
    };
  }

  async findOwnedOrFail(user: UserModel, simulationId: string): Promise<SimulationModel> {
    const simulation = await this.prisma.simulation.findUnique({ where: { id: simulationId } });
    if (!simulation) throw new AppError('SIMULATION_NOT_FOUND');
    if (simulation.userId !== user.id) {
      this.logger.warn(`越权访问模拟 simulation=${simulationId}，请求者 ${user.id}`);
      throw new AppError('SIMULATION_NOT_FOUND');
    }
    return simulation;
  }
}