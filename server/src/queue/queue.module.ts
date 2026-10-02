import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { AppConfiguration } from '../common/config/configuration.js';

/** 队列名集中在这里，避免各处拼字符串拼错。 */
export const AI_TASK_QUEUE = 'ai-tasks';

/**
 * BullMQ 连接。
 *
 * ⚠️ 这里**必须传一个已经建好的 ioredis 实例**，不能传
 * `connection: { host, port, ... }` 那套配置对象。原因：
 *
 * BullMQ 6 把 ioredis 降级成了「可选依赖」，需要时用 `require('ioredis')`
 * 惰性加载。但本项目是原生 ESM（package.json 里 `"type": "module"`），
 * 没有 `require` —— 于是 BullMQ 直接报
 * 「could not load the optional 'ioredis' package」。
 * 规避方式就是它自己提示的那句：**在 ESM 环境下传入已构造好的客户端实例**。
 *
 * 另外 `maxRetriesPerRequest: null` 是 BullMQ Worker 的硬性要求：
 * 阻塞式命令（BRPOPLPUSH）会长时间占住连接，ioredis 默认的重试上限
 * 会把它当超时掐断。
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfiguration, true>) => {
        const redis = config.get('redis', { infer: true });
        return {
          connection: new Redis({
            host: redis.host,
            port: redis.port,
            // 空字符串会让 ioredis 去用空密码认证，必须转成 undefined
            password: redis.password || undefined,
            db: redis.db,
            maxRetriesPerRequest: null,
          }),
        };
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}