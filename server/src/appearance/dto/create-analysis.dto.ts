import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateAnalysisDto {
  @ApiProperty({ description: '已上传完成的照片 ID', format: 'uuid' })
  @IsUUID('4', { message: 'photoId 必须是合法的 UUID' })
  photoId!: string;
}