import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { UserModel } from '../generated/prisma/models.js';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto.js';
import { PhotosService, type UploadTicket } from './photos.service.js';

@ApiTags('photos')
@Controller('photos')
export class PhotosController {
  constructor(private readonly photos: PhotosService) {}

  @Post('upload-url')
  @ApiOperation({
    summary: '获取预签名上传地址',
    description:
      '客户端拿到 uploadUrl 后用 PUT 直传对象存储（图片字节不经过后端），' +
      '成功后调用 POST /photos/{photoId}/complete。',
  })
  createUploadUrl(
    @CurrentUser() user: UserModel,
    @Body() dto: CreateUploadUrlDto,
  ): Promise<UploadTicket> {
    return this.photos.createUploadUrl(user, dto);
  }

  @Post(':photoId/complete')
  @ApiOperation({
    summary: '上报上传完成',
    description: '后端会真的去对象存储确认对象存在，然后才把照片标记为 READY。该接口幂等。',
  })
  async complete(
    @CurrentUser() user: UserModel,
    @Param('photoId', new ParseUUIDPipe({ version: '4' })) photoId: string,
  ): Promise<{ photoId: string; status: string; sizeBytes: number | null }> {
    const photo = await this.photos.complete(user, photoId);
    return {
      photoId: photo.id,
      status: photo.status,
      sizeBytes: photo.sizeBytes,
    };
  }
}