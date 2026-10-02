import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AiTaskStatus } from '../generated/prisma/enums.js';
import type { UserModel } from '../generated/prisma/models.js';
import { AppearanceService } from './appearance.service.js';
import { CreateAnalysisDto } from './dto/create-analysis.dto.js';

@ApiTags('analysis')
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly appearance: AppearanceService) {}

  @Post()
  @ApiOperation({
    summary: '创建外貌分析任务',
    description:
      '异步任务：立即返回 taskId 与初始状态，客户端用 GET /analysis/{taskId} 轮询。' +
      '同一张照片已有在途任务时直接复用，不会重复提交。',
  })
  create(
    @CurrentUser() user: UserModel,
    @Body() dto: CreateAnalysisDto,
  ): Promise<{ taskId: string; status: AiTaskStatus }> {
    return this.appearance.createAnalysisTask(user, dto.photoId);
  }

  @Get(':taskId')
  @ApiOperation({
    summary: '查询分析任务状态',
    description: 'status 为 SUCCESS 时返回 profile 字段。',
  })
  get(
    @CurrentUser() user: UserModel,
    @Param('taskId', new ParseUUIDPipe({ version: '4' })) taskId: string,
  ) {
    return this.appearance.getTask(user, taskId);
  }
}