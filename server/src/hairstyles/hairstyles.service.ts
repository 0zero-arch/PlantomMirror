import { Injectable } from '@nestjs/common';
import { AppError } from '../common/errors/app-error.js';
import { Gender } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import type { ListHairstylesDto } from './dto/list-hairstyles.dto.js';

export interface HairstyleView {
  id: string;
  code: string;
  name: string;
  category: string | null;
  gender: Gender;
  length: string | null;
  texture: string | null;
  /** 预签名下载地址；没有参考图时为 null */
  referenceImageUrl: string | null;
}

@Injectable()
export class HairstylesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /**
   * 发型列表。
   *
   * 只返回 active=true 的 —— 下架发型不应该出现在客户端的选型页，
   * 但历史模拟记录仍然引用得到它（所以是软下架而非删除）。
   */
  async list(filter: ListHairstylesDto): Promise<HairstyleView[]> {
    const rows = await this.prisma.hairstyle.findMany({
      where: {
        active: true,
        ...(filter.gender ? { gender: filter.gender } : {}),
        ...(filter.category ? { category: filter.category } : {}),
        ...(filter.length ? { length: filter.length } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    // 并行为每张参考图签发地址。列表通常只有几十条，一次性签完最快。
    return Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        category: row.category,
        gender: row.gender,
        length: row.length,
        texture: row.texture,
        referenceImageUrl: row.referenceImage
          ? await this.storage.createDownloadUrl(row.referenceImage)
          : null,
      })),
    );
  }

  /** 供 simulations 使用：拿到发型并校验它还在架上。 */
  async findActiveOrFail(id: string) {
    const hairstyle = await this.prisma.hairstyle.findUnique({ where: { id } });
    if (!hairstyle) throw new AppError('HAIRSTYLE_NOT_FOUND');
    return hairstyle;
  }
}