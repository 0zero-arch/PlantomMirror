import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../common/config/configuration.js';
import { PrismaService } from '../prisma/prisma.service.js';

type CheckState = 'up' | 'down';

interface HealthResponse {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  aiProvider: string;
  checks: {
    database: CheckState;
    /** 数据库往返耗时，冷启动/网络问题时这个数字最能说明问题 */
    databaseLatencyMs?: number;
  };
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  /**
   * 健康检查。
   *
   * 刻意真的去 ping 一次数据库，而不是返回一个写死的 {status:'ok'} ——
   * 后者在数据库连不上时依然报健康，没有任何意义。
   *
   * 这个接口也是 Phase 1 的验收口径之一：能返回 200 且 database=up，
   * 就说明「应用起来了、能连上数据库」。
   */
  @Get()
  @ApiOperation({ summary: '健康检查（含数据库连通性）' })
  async check(): Promise<HealthResponse> {
    const startedAt = Date.now();
    let database: CheckState = 'up';
    let databaseLatencyMs: number | undefined;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseLatencyMs = Date.now() - startedAt;
    } catch {
      database = 'down';
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      aiProvider: this.config.get('ai.provider', { infer: true }),
      checks: { database, databaseLatencyMs },
    };
  }
}