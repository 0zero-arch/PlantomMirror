import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AppError } from '../common/errors/app-error.js';
import type { UserModel } from '../generated/prisma/models.js';

export interface RequestWithUser extends Request {
  /** 中间件解析成功时才有值 */
  user?: UserModel;
}

/**
 * 取当前匿名用户。
 *
 * 中间件是「尽力而为」的：带了合法的 X-Anonymous-Id 就解析出用户，
 * 没带就放行 —— 这样 /health 之类的公开路由不必带身份。
 *
 * 需要身份的路由自己声明 `@CurrentUser() user: UserModel`，
 * 没带身份时在这里抛 401。**权限要求写在路由签名上**，
 * 而不是藏在一个全局开关里 —— 读代码时一眼能看出哪些接口需要身份。
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): UserModel => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  if (!request.user) {
    throw new AppError('UNAUTHORIZED', '缺少 X-Anonymous-Id 请求头');
  }
  return request.user;
});