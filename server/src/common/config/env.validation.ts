import { plainToInstance, Transform } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';

/**
 * 启动时的环境变量校验。
 *
 * 目标：配置错了就在**启动瞬间**响亮地失败，而不是等到第一个请求
 * 才抛一个莫名其妙的连接错误。这比任何运行时兜底都省时间。
 */

const toNumber = () =>
  Transform(({ value }) => (value === undefined || value === '' ? undefined : Number(value)), {
    toClassOnly: true,
  });

export class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  @IsOptional()
  NODE_ENV: string = 'development';

  @toNumber()
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api/v1';

  // ---- 数据库：没有它服务跑不起来，必填 ----
  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL 必填，本地开发请先建立 SSH 隧道并填好 .env' })
  DATABASE_URL!: string;

  // ---- Redis ----
  @IsString()
  @IsOptional()
  REDIS_HOST: string = '127.0.0.1';

  @toNumber()
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  REDIS_PORT: number = 6380;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD: string = '';

  @toNumber()
  @IsInt()
  @Min(0)
  @IsOptional()
  REDIS_DB: number = 0;

  // ---- 对象存储 ----
  @IsString()
  @IsNotEmpty({ message: 'S3_ENDPOINT 必填' })
  S3_ENDPOINT!: string;

  @IsString()
  @IsNotEmpty({ message: 'S3_ACCESS_KEY 必填' })
  S3_ACCESS_KEY!: string;

  @IsString()
  @IsNotEmpty({ message: 'S3_SECRET_KEY 必填' })
  S3_SECRET_KEY!: string;

  @IsString()
  @IsOptional()
  S3_BUCKET: string = 'phantommirror';

  @IsString()
  @IsOptional()
  S3_REGION: string = 'us-east-1';

  @IsString()
  @IsOptional()
  S3_PUBLIC_ENDPOINT?: string;

  @toNumber()
  @IsInt()
  @Min(60)
  @IsOptional()
  S3_PRESIGN_EXPIRES: number = 900;

  // ---- AI ----
  @IsIn(['mock', 'perfect-corp', 'gemini'])
  @IsOptional()
  AI_PROVIDER: string = 'mock';

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = '*';
}

export function validate(raw: Record<string, unknown>): EnvironmentVariables {
  const instance = plainToInstance(EnvironmentVariables, raw, {
    enableImplicitConversion: false,
    exposeDefaultValues: true,
  });

  const errors = validateSync(instance, { skipMissingProperties: false, whitelist: false });

  if (errors.length > 0) {
    const details = errors
      .map((err) => `  - ${err.property}: ${Object.values(err.constraints ?? {}).join('; ')}`)
      .join('\n');
    throw new Error(`环境变量校验失败：\n${details}\n\n请对照 server/.env.example 检查 .env`);
  }

  return instance;
}