import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Gender } from '../../generated/prisma/enums.js';

export class ListHairstylesDto {
  @ApiPropertyOptional({ description: '按适用性别筛选', enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: '按分类筛选，例如「短发」「卷发」' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '按长度筛选：short / medium / long' })
  @IsOptional()
  @IsString()
  length?: string;
}