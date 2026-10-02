import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { AnonymousUserMiddleware } from './anonymous.middleware.js';

/**
 * Phase 1 的「认证」就是解析匿名身份，没有更多。
 * Phase 2 加注册登录时，这里会长出 JwtModule / 策略等，但
 * 下游模块的 @CurrentUser() 用法不需要改。
 */
@Module({})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Nest 11+/Express 5 起，通配符必须具名：{*splat} 匹配包括根路径在内的所有路径。
    consumer.apply(AnonymousUserMiddleware).forRoutes('{*splat}');
  }
}