import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import { AppError } from '../common/errors/app-error.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { RequestWithUser } from './current-user.decorator.js';

/**
 * 匿名身份解析（架构文档 §8）。
 *
 * 客户端在每个请求头带 `X-Anonymous-Id`（见客户端 auth_interceptor.dart），
 * 这里据此 upsert 一个匿名用户并把结果挂到 req.user。
 * Phase 1 不做注册登录。
 *
 * 刻意做成「尽力而为」而不是「强制」：
 *  - /health 这类公开路由不该被身份拦住；
 *  - 权限判断集中在 @CurrentUser()，见 current-user.decorator.ts。
 */
@Injectable()
export class AnonymousUserMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AnonymousUserMiddleware.name);

  /**
   * 客户端当前生成的是 `anon_<32位hex>`，但这里刻意放宽。
   *
   * 理由：这串值会存进数据库并作为后续所有查询的归属键。放宽格式能容忍
   * 客户端换生成方式而不必同步改后端；而长度上下界 + 字符白名单已经足以
   * 挡住明显的滥用（超长串、控制字符、注入尝试）。
   */
  private static readonly ANONYMOUS_ID_PATTERN = /^[A-Za-z0-9._-]{8,128}$/;

  constructor(private readonly prisma: PrismaService) {}

  async use(req: RequestWithUser, _res: Response, next: NextFunction): Promise<void> {
    const raw = req.header('X-Anonymous-Id')?.trim();

    if (!raw || !AnonymousUserMiddleware.ANONYMOUS_ID_PATTERN.test(raw)) {
      // 不合法就当没带：由 @CurrentUser() 在需要身份的路由上拒绝。
      // 不在这里直接 401，是为了不让 /health 也被牵连。
      next();
      return;
    }

    try {
      req.user = await this.prisma.user.upsert({
        where: { anonymousId: raw },
        create: { anonymousId: raw },
        update: {},
      });
    } catch (err) {
      // 数据库挂了要在最外层变成一个明确的 503，而不是后续代码的空指针
      this.logger.error(`解析匿名身份失败 anonymousId=${raw}: ${(err as Error).message}`);
      next(new AppError('DATABASE_UNAVAILABLE', undefined, err));
      return;
    }

    next();
  }
}