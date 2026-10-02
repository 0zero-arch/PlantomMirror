import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import type { AppConfiguration } from '../common/config/configuration.js';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * 数据库访问入口。
 *
 * 架构约束（server-architecture.md §4）：所有模块通过 PrismaService 访问数据库，
 * 不允许裸写连接。这里是全应用唯一的数据库连接持有者。
 *
 * Prisma 7 起不再内置连接引擎，必须显式传入 driver adapter —— 这就是
 * 下面构造 PrismaPg 的原因。
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService<AppConfiguration, true>) {
    const connectionString = config.get('database.url', { infer: true });
    const isDev = config.get('nodeEnv', { infer: true }) === 'development';

    super({
      adapter: new PrismaPg({ connectionString }),
      // 开发期把 SQL 打出来，是理解 Prisma 到底发了什么的最快方式
      log: isDev ? ['query', 'warn', 'error'] : ['warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('数据库连接就绪');
  }

  // 关键：不优雅关闭连接池，部署重启时会在数据库侧留下悬挂连接
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('数据库连接已释放');
  }
}