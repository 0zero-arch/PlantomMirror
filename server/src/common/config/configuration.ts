/**
 * 环境变量 -> 结构化配置。
 *
 * 全部字段在这里集中读取一次，业务代码通过注入 ConfigService 拿，
 * 不再到处 `process.env.XXX`。好处：改名或加校验时只需动这一个文件，
 * 且 `config.get('s3.bucket', { infer: true })` 有完整类型提示。
 */

export interface AppConfiguration {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  apiPrefix: string;
  database: { url: string };
  redis: { host: string; port: number; password: string; db: number };
  s3: {
    endpoint: string;
    region: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    forcePathStyle: boolean;
    /** 写进预签名 URL 的主机名，必须对客户端可达 */
    publicEndpoint: string;
    presignExpires: number;
  };
  ai: {
    provider: string;
    perfectCorpApiKey?: string;
    geminiApiKey?: string;
  };
  corsOrigin: string;
}

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1';
}

export function loadConfiguration(): AppConfiguration {
  // 走到这里说明 env.validation.ts 已经校验通过，可以放心断言。
  return {
    nodeEnv: (process.env['NODE_ENV'] ?? 'development') as AppConfiguration['nodeEnv'],
    port: num(process.env['PORT'], 3000),
    apiPrefix: process.env['API_PREFIX'] ?? 'api/v1',

    database: {
      url: process.env['DATABASE_URL']!,
    },

    redis: {
      host: process.env['REDIS_HOST'] ?? '127.0.0.1',
      port: num(process.env['REDIS_PORT'], 6380),
      password: process.env['REDIS_PASSWORD'] ?? '',
      db: num(process.env['REDIS_DB'], 0),
    },

    s3: {
      endpoint: process.env['S3_ENDPOINT'] ?? 'http://127.0.0.1:9000',
      region: process.env['S3_REGION'] ?? 'us-east-1',
      accessKey: process.env['S3_ACCESS_KEY'] ?? '',
      secretKey: process.env['S3_SECRET_KEY'] ?? '',
      bucket: process.env['S3_BUCKET'] ?? 'phantommirror',
      forcePathStyle: bool(process.env['S3_FORCE_PATH_STYLE'], true),
      publicEndpoint: process.env['S3_PUBLIC_ENDPOINT'] ?? process.env['S3_ENDPOINT'] ?? 'http://127.0.0.1:9000',
      presignExpires: num(process.env['S3_PRESIGN_EXPIRES'], 900),
    },

    ai: {
      provider: process.env['AI_PROVIDER'] ?? 'mock',
      perfectCorpApiKey: process.env['PERFECT_CORP_API_KEY'],
      geminiApiKey: process.env['GEMINI_API_KEY'],
    },

    corsOrigin: process.env['CORS_ORIGIN'] ?? '*',
  };
}