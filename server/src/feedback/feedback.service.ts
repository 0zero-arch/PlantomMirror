import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { UserModel } from '../generated/prisma/models.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SimulationsService } from '../simulations/simulations.service.js';
import type { CreateFeedbackDto } from './dto/create-feedback.dto.js';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly simulations: SimulationsService,
  ) {}

  /**
   * 提交反馈。
   *
   * 同一条模拟重复提交视为**修改**而不是新增 —— 用户改主意很正常，
   * 攒一堆自相矛盾的记录只会让后续分析更难做。
   *
   * 归属校验复用 SimulationsService.findOwnedOrFail：别人的模拟回
   * SIMULATION_NOT_FOUND（而非 FORBIDDEN），免得泄露「这个 id 存在」。
   */
  async submit(
    user: UserModel,
    dto: CreateFeedbackDto,
  ): Promise<{ feedbackId: string; simulationId: string }> {
    if (dto.rating === undefined && dto.reason === undefined && !dto.comment) {
      // 全空等于没提交，按参数错误处理，而不是默默写一行空记录
      throw new BadRequestException('rating、reason、comment 至少要填一项');
    }

    const simulation = await this.simulations.findOwnedOrFail(user, dto.simulationId);

    const existing = await this.prisma.feedback.findFirst({
      where: { simulationId: simulation.id, userId: user.id },
    });

    const data = {
      rating: dto.rating,
      reason: dto.reason,
      comment: dto.comment,
    };

    if (existing) {
      const updated = await this.prisma.feedback.update({ where: { id: existing.id }, data });
      this.logger.log(`反馈已更新 feedback=${updated.id} simulation=${simulation.id}`);
      return { feedbackId: updated.id, simulationId: simulation.id };
    }

    const created = await this.prisma.feedback.create({
      data: { ...data, simulationId: simulation.id, userId: user.id },
    });
    this.logger.log(`反馈已提交 feedback=${created.id} simulation=${simulation.id}`);
    return { feedbackId: created.id, simulationId: simulation.id };
  }
}