import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 统一错误码登记表。
 *
 * 这里是错误语义的唯一事实来源：状态码与「是否可重试」都在此定义，
 * 业务代码只引用 key，不散落魔法字符串。
 *
 * retryable 直接透传给客户端：客户端的 TaskPoller / 重试逻辑据此决定
 * 是自动重试还是弹窗让用户决定（见客户端 core/network/api_exception.dart）。
 */
export const ERROR_CODES = {
  // ---- 请求本身有问题，重试没用 ----
  VALIDATION_FAILED: { status: HttpStatus.BAD_REQUEST, retryable: false, message: '请求参数不合法' },
  UNAUTHORIZED: { status: HttpStatus.UNAUTHORIZED, retryable: false, message: '缺少有效的身份标识' },
  FORBIDDEN: { status: HttpStatus.FORBIDDEN, retryable: false, message: '无权访问该资源' },
  NOT_FOUND: { status: HttpStatus.NOT_FOUND, retryable: false, message: '资源不存在' },

  // ---- 业务对象 ----
  PHOTO_NOT_FOUND: { status: HttpStatus.NOT_FOUND, retryable: false, message: '照片不存在' },
  PHOTO_NOT_READY: { status: HttpStatus.CONFLICT, retryable: false, message: '照片尚未上传完成' },
  HAIRSTYLE_NOT_FOUND: { status: HttpStatus.NOT_FOUND, retryable: false, message: '发型不存在' },
  SIMULATION_NOT_FOUND: { status: HttpStatus.NOT_FOUND, retryable: false, message: '模拟任务不存在' },
  TASK_NOT_FOUND: { status: HttpStatus.NOT_FOUND, retryable: false, message: '任务不存在' },
  APPEARANCE_PROFILE_NOT_FOUND: { status: HttpStatus.NOT_FOUND, retryable: false, message: '外貌画像不存在' },

  // ---- 状态冲突 ----
  AI_TASK_IN_PROGRESS: { status: HttpStatus.CONFLICT, retryable: false, message: '任务正在处理中，请勿重复提交' },

  // ---- 外部依赖/瞬时故障，重试有意义 ----
  STORAGE_UNAVAILABLE: { status: HttpStatus.SERVICE_UNAVAILABLE, retryable: true, message: '对象存储暂时不可用' },
  AI_PROVIDER_UNAVAILABLE: { status: HttpStatus.SERVICE_UNAVAILABLE, retryable: true, message: 'AI 服务暂时不可用' },
  AI_PROVIDER_FAILED: { status: HttpStatus.BAD_GATEWAY, retryable: true, message: 'AI 服务处理失败' },
  DATABASE_UNAVAILABLE: { status: HttpStatus.SERVICE_UNAVAILABLE, retryable: true, message: '数据库暂时不可用' },

  // ---- 兜底 ----
  INTERNAL_ERROR: { status: HttpStatus.INTERNAL_SERVER_ERROR, retryable: false, message: '服务内部错误' },
} as const;

export type ErrorCodeKey = keyof typeof ERROR_CODES;

/** 与客户端 ApiException 解析的结构严格一致，不要随意加字段。 */
export interface ApiErrorBody {
  code: ErrorCodeKey;
  message: string;
  retryable: boolean;
}

/**
 * 业务异常。
 *
 * 用法：`throw new AppError('PHOTO_NOT_FOUND')`
 * 需要覆盖文案时：`throw new AppError('PHOTO_NOT_FOUND', '这张照片已经被删除了')`
 */
export class AppError extends HttpException {
  readonly code: ErrorCodeKey;
  readonly retryable: boolean;

  constructor(code: ErrorCodeKey, message?: string, cause?: unknown) {
    const entry = ERROR_CODES[code];
    const body: ApiErrorBody = {
      code,
      message: message ?? entry.message,
      retryable: entry.retryable,
    };
    super(body, entry.status, { cause });
    this.code = code;
    this.retryable = entry.retryable;
  }

  /** 从登记的 key 直接抛，省去业务代码里 repeated 的 `new`。 */
  static throw(code: ErrorCodeKey, message?: string): never {
    throw new AppError(code, message);
  }
}

/**
 * 类型收窄工具。
 *
 * 队列处理器里 catch 到的是 `unknown`，需要区分「我们自己抛的业务异常」
 * 和「意料之外的崩溃」—— 前者把 code 带进日志便于定位，后者只能打堆栈。
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}