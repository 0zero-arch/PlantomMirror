import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

/**
 * 端到端冒烟测试。
 *
 * ⚠️ 与单元测试不同，这个套件需要真实基础设施：
 * PostgreSQL / Redis / MinIO 必须可达（见 server/.env.example 与 docker-compose.yml），
 * 因为 StorageService.onModuleInit 会去确认 bucket 存在，连不上就直接启动失败
 * —— 这是刻意的快速失败，见 storage.service.ts 的注释。
 *
 * 本地跑之前先建立 SSH 隧道：
 *   ssh -N -L 5433:127.0.0.1:5433 -L 9000:127.0.0.1:9000 \
 *          -L 9001:127.0.0.1:9001 ubuntu@101.35.163.174
 */
describe('PhantomMirror API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // main.ts 里的全局前缀不会自动带到测试里，这里补上
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health 返回 200 且数据库连通', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      checks: { database: 'up' },
    });
    expect(typeof response.body.uptimeSeconds).toBe('number');
  });
});