import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppError, ERROR_CODES, type ApiErrorBody, type ErrorCodeKey } from '../errors/app-error.js';

/** 非 AppError 的 HttpException，按状态码反查一个语义最接近的登记项。 */
const STATUS_TO_CODE: Partial<Record<number, ErrorCodeKey>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_FAILED',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'STORAGE_UNAVAILABLE',
};

/**
 * 全局异常出口。
 *
 * 职责：把任何异常（业务异常 / 参数校验失败 / 未捕获崩溃）都收敛成
 * 客户端能解析的统一结构 { code, message, retryable }。
 *
 * 契约见 server-architecture.md §8，客户端 dio_client.dart 已按此解析，
 * 两边必须保持一致 —— 所以这里刻意不往响应里塞额外字段。
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, body, detail } = normalize(exception);
    const where = `${request.method} ${request.originalUrl}`;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // 只有非预期错误才打完整堆栈，业务异常（比如照片不存在）打堆栈没有意义
      this.logger.error(`${where} -> ${status} ${body.code}${detail ? ` (${detail})` : ''}`, exception);
    } else {
      this.logger.debug(`${where} -> ${status} ${body.code}${detail ? ` (${detail})` : ''}`);
    }

    response.status(status).json(body);
  }
}

interface Normalized {
  status: number;
  body: ApiErrorBody;
  detail?: string;
}

function normalize(exception: unknown): Normalized {
  // 1) 我们自己抛的业务异常：body 已经是最终形态
  if (exception instanceof AppError) {
    return { status: exception.getStatus(), body: exception.getResponse() as ApiErrorBody };
  }

  // 2) 框架/三方抛的 HttpException
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const res = exception.getResponse();
    const detail = extractMessage(res);

    // ValidationPipe 拒绝请求时会抛 BadRequestException，message 是逐条约束的数组，
    // 直接把这些约束拼进 message —— 这是开发期最有用的信息。
    if (status === HttpStatus.BAD_REQUEST) {
      return {
        status,
        body: {
          code: 'VALIDATION_FAILED',
          message: detail ?? ERROR_CODES.VALIDATION_FAILED.message,
          retryable: false,
        },
        detail,
      };
    }

    const code = STATUS_TO_CODE[status] ?? 'INTERNAL_ERROR';
    return {
      status,
      body: { code, message: detail ?? ERROR_CODES[code].message, retryable: ERROR_CODES[code].retryable },
      detail,
    };
  }

  // 3) 兜底：未预期崩溃。绝不把内部细节透给客户端，但完整记进日志。
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    body: {
      code: 'INTERNAL_ERROR',
      message: ERROR_CODES.INTERNAL_ERROR.message,
      retryable: ERROR_CODES.INTERNAL_ERROR.retryable,
    },
    detail: exception instanceof Error ? exception.message : String(exception),
  };
}

/** 从 HttpException 的 response 里抽出可读文案，兼容 string / {message} / string[]。 */
function extractMessage(res: string | object): string | undefined {
  if (typeof res === 'string') return res;
  if (res !== null && 'message' in res) {
    const raw = (res as { message: unknown }).message;
    if (Array.isArray(raw)) return raw.join('；');
    if (typeof raw === 'string') return raw;
  }
  return undefined;
}