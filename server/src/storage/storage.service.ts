import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { AppConfiguration } from '../common/config/configuration.js';
import { AppError } from '../common/errors/app-error.js';

/**
 * 对象存储封装（MinIO / 任意 S3 兼容服务）。
 *
 * ── 为什么要两个 S3Client ──────────────────────────────────────────
 * MinIO 绑在服务器的 127.0.0.1 上，但预签名 URL 是给**手机**用的。
 * SigV4 签名把 Host 头算进了签名串，所以签完再替换域名 = 签名失效。
 * 唯一正确的做法是：签名时就使用「客户端将来真正访问的那个端点」。
 *
 *   internal  → 服务器自己要收发字节时用（确保桶存在、校验文件大小）
 *   signing   → 只用于签发 URL，端点填 S3_PUBLIC_ENDPOINT
 *
 * 签名本身是纯本地计算，不需要真的能连上那个端点，所以服务器上
 * 即使访问不到 S3_PUBLIC_ENDPOINT 也不影响签发。
 * ────────────────────────────────────────────────────────────────
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly internal: S3Client;
  private readonly signing: S3Client;
  private readonly bucket: string;
  private readonly presignExpires: number;

  constructor(private readonly config: ConfigService<AppConfiguration, true>) {
    const s3 = config.get('s3', { infer: true });
    this.bucket = s3.bucket;
    this.presignExpires = s3.presignExpires;

    const shared = {
      region: s3.region,
      credentials: { accessKeyId: s3.accessKey, secretAccessKey: s3.secretKey },
      // MinIO 不支持 virtual-host 风格（bucket.host），必须开 path style
      forcePathStyle: s3.forcePathStyle,
    };

    this.internal = new S3Client({ ...shared, endpoint: s3.endpoint });
    this.signing =
      s3.publicEndpoint === s3.endpoint
        ? this.internal
        : new S3Client({ ...shared, endpoint: s3.publicEndpoint });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBucket();
  }

  /** 桶不存在就建。开发期反复重建环境时省掉一次手动操作。 */
  private async ensureBucket(): Promise<void> {
    try {
      await this.internal.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`对象存储就绪：bucket=${this.bucket}`);
    } catch (err) {
      const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status !== 404 && status !== 403) {
        // 连不上就明确报出来，别等到上传时才 500
        this.logger.error(`对象存储不可达：${(err as Error).message}`);
        throw new AppError('STORAGE_UNAVAILABLE', undefined, err);
      }
      try {
        await this.internal.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`已创建 bucket：${this.bucket}`);
      } catch (createErr) {
        this.logger.error(`创建 bucket 失败：${(createErr as Error).message}`);
        throw new AppError('STORAGE_UNAVAILABLE', undefined, createErr);
      }
    }
  }

  /**
   * 签发上传地址。客户端拿到后直接 PUT 字节到对象存储，
   * 图片**不经过后端**（架构文档 §9.1）。
   *
   * ContentType 必须一起签进去：否则客户端可以谎报类型上传任意文件。
   */
  async createUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return this.sign(command);
  }

  /** 签发下载地址。桶是私有的，客户端看图必须走这个。 */
  async createDownloadUrl(key: string, expiresIn?: number): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return this.sign(command, expiresIn);
  }

  /**
   * 确认对象真的落盘了。
   * 客户端调用 /photos/{id}/complete 时用它校验，防止把「谎报上传成功」
   * 的照片标记成 READY。
   */
  async statObject(key: string): Promise<{ size: number; contentType?: string } | null> {
    try {
      const head = await this.internal.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { size: head.ContentLength ?? 0, contentType: head.ContentType };
    } catch (err) {
      const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status === 404) return null;
      throw new AppError('STORAGE_UNAVAILABLE', undefined, err);
    }
  }

  /**
   * 服务端把对象读回内存。
   *
   * 走 internal 客户端，不依赖预签名 URL —— 服务器未必能访问自己的对外端点
   * （MinIO 绑在 127.0.0.1，对外端点可能尚未在安全组放行）。
   */
  async getObjectBytes(key: string): Promise<{ body: Buffer; contentType?: string } | null> {
    try {
      const res = await this.internal.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      if (!res.Body) return null;
      const bytes = await res.Body.transformToByteArray();
      return { body: Buffer.from(bytes), contentType: res.ContentType };
    } catch (err) {
      const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status === 404) return null;
      throw new AppError('STORAGE_UNAVAILABLE', undefined, err);
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.internal.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      // 删除失败不该阻断主流程，记下来就够了
      this.logger.warn(`删除对象失败 key=${key}: ${(err as Error).message}`);
    }
  }

  /** 服务端自己写对象（MockProvider 产出占位结果图时用）。 */
  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    try {
      await this.internal.send(
        new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
      );
    } catch (err) {
      throw new AppError('STORAGE_UNAVAILABLE', undefined, err);
    }
  }

  private sign(command: PutObjectCommand | GetObjectCommand, expiresIn?: number): Promise<string> {
    return getSignedUrl(this.signing, command, {
      expiresIn: expiresIn ?? this.presignExpires,
    });
  }
}