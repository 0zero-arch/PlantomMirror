import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AiTasksModule } from '../ai-tasks/ai-tasks.module.js';
import { AiModule } from '../ai/ai.module.js';
import { HairstylesModule } from '../hairstyles/hairstyles.module.js';
import { PhotosModule } from '../photos/photos.module.js';
import { AI_TASK_QUEUE } from '../queue/queue.module.js';
import { SimulationProcessor } from './simulations.processor.js';
import { SimulationsController } from './simulations.controller.js';
import { SimulationsService } from './simulations.service.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: AI_TASK_QUEUE }),
    AiTasksModule,
    AiModule,
    PhotosModule,
    HairstylesModule,
  ],
  controllers: [SimulationsController],
  providers: [SimulationsService, SimulationProcessor],
  exports: [SimulationsService],
})
export class SimulationsModule {}