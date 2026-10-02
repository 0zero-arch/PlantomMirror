import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { UserModel } from '../generated/prisma/models.js';
import { CreateFeedbackDto } from './dto/create-feedback.dto.js';
import { FeedbackService } from './feedback.service.js';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Post()
  @ApiOperation({
    summary: '提交试戴结果反馈',
    description: '同一条模拟重复提交视为修改。rating / reason / comment 至少填一项。',
  })
  submit(
    @CurrentUser() user: UserModel,
    @Body() dto: CreateFeedbackDto,
  ): Promise<{ feedbackId: string; simulationId: string }> {
    return this.feedback.submit(user, dto);
  }
}