import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AiTasksModule } from '../ai-tasks/ai-tasks.module.js';
import { AiModule } from '../ai/ai.module.js';
import { PhotosModule } from '../photos/photos.module.js';
import { AI_TASK_QUEUE } from '../queue/queue.module.js';
import { AnalysisController } from './analysis.controller.js';
import { AnalysisProcessor } from './analysis.processor.js';
import { AppearanceService } from './appearance.service.js';

@Module({
  imports: [BullModule.registerQueue({ name: AI_TASK_QUEUE }), AiTasksModule, AiModule, PhotosModule],
  controllers: [AnalysisController],
  providers: [AppearanceService, AnalysisProcessor],
  exports: [AppearanceService],
})
export class AppearanceModule {}