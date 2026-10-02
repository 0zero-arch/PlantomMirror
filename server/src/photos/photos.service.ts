import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../common/config/configuration.js';
import { AppError } from '../common/errors/app-error.js';
import { PhotoStatus, type PhotoType } from '../generated/prisma/enums.js';
import type { PhotoModel, UserModel } from '../generated/prisma/models.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';

export interface UploadTicket {
  photoId: string;
  storageKey: string;
  uploadUrl: string;
  /** 客户端必须用 PUT，且必须带上这里签好的 Content-Type */
  method: 'PUT';
  expiresInSeconds: number;
}

@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);
  private readonly presignExpires: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    config: ConfigService<AppConfiguration, true>,
  ) {
    // 预签名有效期与 StorageService 共用同一份配置，避免两边算出不同的过期时间
    this.presignExpires = config.get('s3.presignExpires', { infer: true });
  }

  /**
   * 签发上传地址（架构文档 §9.1）。
   *
   * 关键设计：**后端从不接触图片字节**。客户端拿到预签名 URL 后直传对象存储，
   * 省掉一次「上传到后端 → 后端再传到存储」的双倍流量与内存占用。
   *
   * 流程刻意分两步（upload-url → complete），因为「签发了地址」不等于
   * 「字节真的到了」。中间任何一步失败，照片都停在 PENDING，不会被误用。
   */
  async createUploadUrl(
    user: UserModel,
    params: { contentType: string; type?: PhotoType; sizeBytes?: number; width?: number; height?: number },
  ): Promise<UploadTicket> {
    const photoId = randomUUID();
    const extension = extensionFor(params.contentType);
    // 按用户分目录：将来做配额、批量清理、权限隔离都从这里受益
    const storageKey = `photos/${user.id}/${photoId}${extension}`;

    await this.prisma.photo.create({
      data: {
        id: photoId,
        userId: user.id,
        storageKey,
        status: PhotoStatus.PENDING,
        type: params.type,
        mimeType: params.contentType,
        sizeBytes: params.sizeBytes,
        width: params.width,
        height: params.height,
      },
    });

    const uploadUrl = await this.storage.createUploadUrl(storageKey, params.contentType);

    this.logger.debug(`已签发上传地址 photo=${photoId} key=${storageKey}`);

    return {
      photoId,
      storageKey,
      uploadUrl,
      method: 'PUT',
      expiresInSeconds: this.presignExpires,
    };
  }

  /**
   * 客户端上报上传完成。
   *
   * 这里**真的去对象存储确认对象存在**，而不是信任客户端的说法。
   * 否则一个网络中断的客户端也能把照片标成 READY，后面分析任务会拿到空文件。
   */
  async complete(user: UserModel, photoId: string): Promise<PhotoModel> {
    const photo = await this.findOwnedOrFail(user, photoId);

    if (photo.status === PhotoStatus.READY) {
      // 幂等：客户端重试 complete 不该报错
      return photo;
    }

    const stat = await this.storage.statObject(photo.storageKey);
    if (!stat) {
      throw new AppError('PHOTO_NOT_READY', '对象存储里还没看到这张图片，请确认上传是否成功');
    }

    return this.prisma.photo.update({
      where: { id: photo.id },
      data: {
        status: PhotoStatus.READY,
        // 以对象存储报告的真实大小为准，覆盖客户端自报的值
        sizeBytes: stat.size,
        mimeType: stat.contentType ?? photo.mimeType,
      },
    });
  }

  /** 取照片并校验归属 —— 越权访问必须在这里挡住，不能靠上层自觉。 */
  async findOwnedOrFail(user: UserModel, photoId: string): Promise<PhotoModel> {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) throw new AppError('PHOTO_NOT_FOUND');
    if (photo.userId !== user.id) {
      // 刻意返回 404 而不是 403：不泄露「这个 id 确实存在，只是不属于你」
      this.logger.warn(`越权访问照片 photo=${photoId} 属于 ${photo.userId}，请求者 ${user.id}`);
      throw new AppError('PHOTO_NOT_FOUND');
    }
    return photo;
  }

  /** 要求照片已就绪，否则后续分析/模拟会拿到不存在的文件。 */
  async findReadyOrFail(user: UserModel, photoId: string): Promise<PhotoModel> {
    const photo = await this.findOwnedOrFail(user, photoId);
    if (photo.status !== PhotoStatus.READY) {
      throw new AppError('PHOTO_NOT_READY', '照片尚未上传完成，请先上传');
    }
    return photo;
  }
}

function extensionFor(contentType: string): string {
  switch (contentType) {
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '.jpg';
  }
}