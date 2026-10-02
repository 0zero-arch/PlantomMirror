import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service.js';

/**
 * 依赖方向（架构文档 §4 硬约束）：storage 只被 photos / simulations 依赖，
 * 不反向依赖任何业务模块 —— 所以标 Global 也不会造成循环依赖。
 */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}