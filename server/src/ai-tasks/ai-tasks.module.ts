import { Module } from '@nestjs/common';
import { AiTasksService } from './ai-tasks.service.js';

@Module({
  providers: [AiTasksService],
  exports: [AiTasksService],
})
export class AiTasksModule {}