import { Module } from '@nestjs/common';
import { PhotosController } from './photos.controller.js';
import { PhotosService } from './photos.service.js';

@Module({
  controllers: [PhotosController],
  providers: [PhotosService],
  // simulations / analysis 需要复用它做归属与就绪校验，避免重复实现越权检查
  exports: [PhotosService],
})
export class PhotosModule {}