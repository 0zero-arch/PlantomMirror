import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import type { AppConfiguration } from './common/config/configuration.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService<AppConfiguration, true>);
  const port = config.get('port', { infer: true });
  const apiPrefix = config.get('apiPrefix', { infer: true });
  const corsOrigin = config.get('corsOrigin', { infer: true });

  // 所有接口统一挂在 /api/v1 下（架构文档 §8 的 API 契约表即是这个前缀）。
  // 版本前缀让将来 v2 能与 v1 并存。
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      // 剥掉 DTO 没声明的字段，避免客户端多传的字段悄悄流进业务逻辑
      whitelist: true,
      transform: true,
      // 声明了类型就真的转（'1' -> 1），否则 query 参数永远都是字符串
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 统一错误结构 { code, message, retryable }，见 all-exceptions.filter.ts
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()),
  });

  // 让 onModuleDestroy 真的被调用 —— 否则 Prisma 连接池不会被释放
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('PhantomMirror API')
    .setDescription('幻境 · AI 发型试戴后端接口')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`服务已启动：http://127.0.0.1:${port}/${apiPrefix}`);
  logger.log(`接口文档：http://127.0.0.1:${port}/api/docs`);
  logger.log(`AI 供应商：${config.get('ai.provider', { infer: true })}`);
}

await bootstrap();