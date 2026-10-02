import { Module } from '@nestjs/common';
import { HairstylesController } from './hairstyles.controller.js';
import { HairstylesService } from './hairstyles.service.js';

@Module({
  controllers: [HairstylesController],
  providers: [HairstylesService],
  exports: [HairstylesService],
})
export class HairstylesModule {}