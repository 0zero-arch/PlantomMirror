import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai/ai.module.js';
import { AiTasksModule } from './ai-tasks/ai-tasks.module.js';
import { AppearanceModule } from './appearance/appearance.module.js';
import { AuthModule } from './auth/auth.module.js';
import { loadConfiguration } from './common/config/configuration.js';
import { validate } from './common/config/env.validation.js';
import { FeedbackModule } from './feedback/feedback.module.js';
import { HairstylesModule } from './hairstyles/hairstyles.module.js';
import { HealthModule } from './health/health.module.js';
import { PhotosModule } from './photos/photos.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { QueueModule } from './queue/queue.module.js';
import { SimulationsModule } from './simulations/simulations.module.js';
import { StorageModule } from './storage/storage.module.js';

/**
 * 模块装配顺序按「依赖方向」排：基础设施 → 身份 → 业务。
 * 业务模块之间不做隐式依赖，需要别家的 Service 就显式 import 它的 Module
 * （例如 feedback 复用 simulations.findOwnedOrFail 做归属校验）。
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // validate 在启动时就把配置问题炸出来，见 env.validation.ts
      validate,
      load: [loadConfiguration],
    }),

    // —— 基础设施 ——
    PrismaModule,
    StorageModule,
    QueueModule, // BullMQ 连接，必须在所有注册队列的模块之前
    AiModule,
    AiTasksModule,

    // —— 身份 ——
    AuthModule,

    // —— 业务 ——
    PhotosModule,
    HairstylesModule,
    AppearanceModule,
    SimulationsModule,
    FeedbackModule,

    // —— 运维 ——
    HealthModule,
  ],
})
export class AppModule {}