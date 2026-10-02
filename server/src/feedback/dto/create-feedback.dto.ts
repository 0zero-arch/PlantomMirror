import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { FeedbackReason } from '../../generated/prisma/enums.js';

export class CreateFeedbackDto {
  @ApiProperty({ description: '要评价的模拟 ID', format: 'uuid' })
  @IsUUID('4', { message: 'simulationId 必须是合法的 UUID' })
  simulationId!: string;

  @ApiPropertyOptional({ description: '1-5 分', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ enum: FeedbackReason, description: '不满意的原因（结构化，便于聚合分析）' })
  @IsOptional()
  @IsEnum(FeedbackReason)
  reason?: FeedbackReason;

  @ApiPropertyOptional({ description: '自由文本补充', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}