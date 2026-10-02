import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PhotoType } from '../../generated/prisma/enums.js';

/**
 * 允许的图片类型白名单。
 *
 * 不做成「随便传 MIME」：ContentType 会被签进预签名 URL，
 * 客户端必须按这个类型上传，否则对象存储会拒绝 —— 这样即便客户端被
 * 篡改，也上传不了可执行文件之类的东西。
 */
export const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** 单张图片大小上限。手机直出照片通常 2-8MB，留足余量即可。 */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export class CreateUploadUrlDto {
  @ApiProperty({
    description: '图片 MIME 类型',
    enum: ALLOWED_CONTENT_TYPES,
    example: 'image/jpeg',
  })
  @IsIn(ALLOWED_CONTENT_TYPES as unknown as string[], {
    message: `contentType 只支持 ${ALLOWED_CONTENT_TYPES.join(' / ')}`,
  })
  contentType!: string;

  @ApiPropertyOptional({ description: '照片用途分类', enum: PhotoType, default: PhotoType.SELFIE })
  @IsOptional()
  @IsEnum(PhotoType)
  type?: PhotoType;

  @ApiPropertyOptional({ description: '文件字节数，用于提前拦截过大的上传', example: 2_400_000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES, { message: `图片不能超过 ${MAX_UPLOAD_BYTES / 1024 / 1024}MB` })
  sizeBytes?: number;

  @ApiPropertyOptional({ description: '图片宽度（客户端裁剪后已知）', example: 1080 })
  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({ description: '图片高度', example: 1440 })
  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;
}