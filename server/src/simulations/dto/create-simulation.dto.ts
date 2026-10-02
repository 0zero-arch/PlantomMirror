import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CreateSimulationDto {
  @ApiProperty({ description: '已上传完成的照片 ID', format: 'uuid' })
  @IsUUID('4', { message: 'photoId 必须是合法的 UUID' })
  photoId!: string;

  @ApiProperty({ description: '要试戴的发型 ID', format: 'uuid' })
  @IsUUID('4', { message: 'hairstyleId 必须是合法的 UUID' })
  hairstyleId!: string;

  @ApiPropertyOptional({
    description:
      '外貌画像 ID。不传则自动使用该照片已有的画像；若该照片尚未分析，也能继续 —— ' +
      '供应商会在没有画像参考的情况下生成。',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  appearanceProfileId?: string;
}