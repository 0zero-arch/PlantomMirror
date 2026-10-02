import { Injectable, Logger } from '@nestjs/common';
import { AppError } from '../common/errors/app-error.js';
import { AiTaskStatus, AiTaskType } from '../generated/prisma/enums.js';
import type { AiTaskModel } from '../generated/prisma/models.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * AI 任务状态机（架构文档 §7）。
 *
 *   CREATED ──→ QUEUED ──→ PROCESSING ──→ SUCCESS
 *                   │            │
 *                   └────────────┴──────→ FAILED
 *                                └──────→ CANCELLED
 *
 * ⚠️ 架构文档 §11 把「状态机的边界情况（超时、取消、重试策略）」
 * 列为**留给创始人的议题**。所以这里刻意把转移规则写成一张可读的表，
 * 而不是散落在各方法里的 if —— 你要调整规则时，只需要改 ALLOWED_TRANSITIONS。
 *
 * 所有业务表（simulations 等）都不重复存状态，状态只在这张表上，
 * 避免两处状态不一致这种最难查的 bug。
 */
@Injectable()
export class AiTasksService {
  private readonly logger = new Logger(AiTasksService.name);

  /**
   * 允许的状态转移。
   *
   * 注意 PROCESSING 不能直接回到 QUEUED：重试要走 FAILED → QUEUED
   * 或者由重试逻辑显式调用 markRequeued()。这样「任务为什么回退了」
   * 在日志里一定有迹可循。
   */
  private static readonly ALLOWED_TRANSITIONS: Record<AiTaskStatus, readonly AiTaskStatus[]> = {
    [AiTaskStatus.CREATED]: [AiTaskStatus.QUEUED, AiTaskStatus.CANCELLED, AiTaskStatus.FAILED],
    [AiTaskStatus.QUEUED]: [AiTaskStatus.PROCESSING, AiTaskStatus.CANCELLED, AiTaskStatus.FAILED],
    [AiTaskStatus.PROCESSING]: [AiTaskStatus.SUCCESS, AiTaskStatus.FAILED, AiTaskStatus.CANCELLED],
    [AiTaskStatus.SUCCESS]: [],
    [AiTaskStatus.FAILED]: [AiTaskStatus.QUEUED],
    [AiTaskStatus.CANCELLED]: [],
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    type: AiTaskType;
    provider: string;
    payload?: unknown;
  }): Promise<AiTaskModel> {
    return this.prisma.aiTask.create({
      data: {
        type: params.type,
        provider: params.provider,
        status: AiTaskStatus.CREATED,
        payload: params.payload === undefined ? undefined : (params.payload as object),
      },
    });
  }

  async findByIdOrFail(id: string): Promise<AiTaskModel> {
    const task = await this.prisma.aiTask.findUnique({ where: { id } });
    if (!task) throw new AppError('TASK_NOT_FOUND');
    return task;
  }

  async markQueued(id: string): Promise<AiTaskModel> {
    return this.transition(id, AiTaskStatus.QUEUED);
  }

  async markProcessing(id: string): Promise<AiTaskModel> {
    return this.transition(id, AiTaskStatus.PROCESSING, {
      startedAt: new Date(),
      // 每次真正开始处理才 +1，而不是入队时 +1 —— 否则「尝试次数」会
      // 把排队的次数也算进去，看不出实际执行了几次
      attempts: { increment: 1 },
    });
  }

  async markSuccess(id: string, result?: unknown): Promise<AiTaskModel> {
    return this.transition(id, AiTaskStatus.SUCCESS, {
      finishedAt: new Date(),
      result: result === undefined ? undefined : (result as object),
      error: null,
    });
  }

  async markFailed(id: string, error: unknown): Promise<AiTaskModel> {
    const message = error instanceof Error ? error.message : String(error);
    return this.transition(id, AiTaskStatus.FAILED, {
      finishedAt: new Date(),
      error: message.slice(0, 2000),
    });
  }

  async markCancelled(id: string): Promise<AiTaskModel> {
    return this.transition(id, AiTaskStatus.CANCELLED, { finishedAt: new Date() });
  }

  /**
   * 记录一次 AI 调用用量（架构文档 §6 / §56）。
   * 失败不能影响主流程 —— 成本监控挂了不该让用户的试戴失败。
   */
  async recordUsage(params: {
    provider: string;
    model?: string;
    taskType: AiTaskType;
    latencyMs?: number;
    inputSize?: number;
    outputSize?: number;
    estimatedCost?: number;
    success: boolean;
  }): Promise<void> {
    try {
      await this.prisma.aiUsage.create({
        data: {
          provider: params.provider,
          model: params.model,
          taskType: params.taskType,
          latencyMs: params.latencyMs,
          inputSize: params.inputSize,
          outputSize: params.outputSize,
          estimatedCost: params.estimatedCost,
          success: params.success,
        },
      });
    } catch (err) {
      this.logger.warn(`写入 ai_usages 失败：${(err as Error).message}`);
    }
  }

  /** 状态转移的统一入口：校验合法性，再落库。 */
  private async transition(
    id: string,
    next: AiTaskStatus,
    extra: Record<string, unknown> = {},
  ): Promise<AiTaskModel> {
    const current = await this.findByIdOrFail(id);
    const allowed = AiTasksService.ALLOWED_TRANSITIONS[current.status];

    if (!allowed.includes(next)) {
      // 这是编程错误而非用户错误：说明调用方漏了某个分支。
      // 大声报出来，不要静默改状态 —— 静默改状态会掩盖并发 bug。
      throw new Error(
        `非法任务状态转移：${current.status} -> ${next}（task=${id}，允许的目标：${allowed.join(', ') || '无'}）`,
      );
    }

    return this.prisma.aiTask.update({ where: { id }, data: { status: next, ...extra } });
  }
}