import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AiTaskStatus } from '../generated/prisma/enums.js';
import type { UserModel } from '../generated/prisma/models.js';
import { CreateSimulationDto } from './dto/create-simulation.dto.js';
import { SimulationsService, type SimulationView } from './simulations.service.js';

@ApiTags('simulations')
@Controller('simulations')
export class SimulationsController {
  constructor(private readonly simulations: SimulationsService) {}

  @Post()
  @ApiOperation({
    summary: '发起一次发型试戴',
    description:
      '异步任务：立即返回 simulationId 与初始状态，客户端用 GET /simulations/{id} 轮询。' +
      '同一张照片 + 同一发型已有在途任务时直接复用，不会重复计费。',
  })
  create(
    @CurrentUser() user: UserModel,
    @Body() dto: CreateSimulationDto,
  ): Promise<{ simulationId: string; taskId: string; status: AiTaskStatus }> {
    return this.simulations.create(user, dto);
  }

  @Get(':simulationId')
  @ApiOperation({
    summary: '查询试戴结果',
    description: 'status 为 SUCCESS 时返回 outputImageUrl（预签名地址，有有效期）。',
  })
  get(
    @CurrentUser() user: UserModel,
    @Param('simulationId', new ParseUUIDPipe({ version: '4' })) simulationId: string,
  ): Promise<SimulationView> {
    return this.simulations.getView(user, simulationId);
  }
}