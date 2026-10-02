/**
 * 发型目录种子数据。
 *
 * 用 `npm run prisma:seed` 跑（底层是 `tsx prisma/seed.ts`）。
 * 幂等：按 `code` upsert，重复跑只会把内容刷新成下面这份，不会插重复行。
 *
 * ⚠️ 这是**技术验证用的占位目录**，不是最终选品。真正的选品要结合
 * 目标人群与供应商实际支持的样式来定 —— 那属于产品决策，留给创始人。
 * 现阶段这里的价值是：让「选发型 → 试戴 → 出图」这条链路有真数据可跑。
 *
 * `referenceImage` 一律留空：参考图要先传进 MinIO 才有 key，
 * 现在还没有素材。客户端在 referenceImageUrl 为 null 时需自行降级显示。
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { Gender } from '../src/generated/prisma/enums.js';

interface SeedHairstyle {
  code: string;
  name: string;
  category: string;
  gender: Gender;
  length: string;
  texture: string;
}

const HAIRSTYLES: SeedHairstyle[] = [
  // —— 男士 ——
  { code: 'm-buzz', name: '寸头', category: '短发', gender: Gender.MALE, length: 'SHORT', texture: 'STRAIGHT' },
  { code: 'm-crew', name: '层次短发', category: '短发', gender: Gender.MALE, length: 'SHORT', texture: 'STRAIGHT' },
  { code: 'm-side-part', name: '三七分', category: '短发', gender: Gender.MALE, length: 'SHORT', texture: 'STRAIGHT' },
  { code: 'm-french-crop', name: '法式碎盖', category: '短发', gender: Gender.MALE, length: 'SHORT', texture: 'STRAIGHT' },
  { code: 'm-comma', name: '逗号刘海', category: '中短发', gender: Gender.MALE, length: 'MEDIUM', texture: 'STRAIGHT' },
  { code: 'm-korean-fringe', name: '韩式刘海', category: '中短发', gender: Gender.MALE, length: 'MEDIUM', texture: 'STRAIGHT' },
  { code: 'm-textured-perm', name: '纹理烫', category: '中短发', gender: Gender.MALE, length: 'MEDIUM', texture: 'WAVY' },
  { code: 'm-slick-back', name: '大背头', category: '短发', gender: Gender.MALE, length: 'SHORT', texture: 'STRAIGHT' },
  { code: 'm-wolf-cut', name: '狼尾', category: '中长发', gender: Gender.MALE, length: 'MEDIUM', texture: 'WAVY' },
  { code: 'm-man-bun', name: '丸子头', category: '长发', gender: Gender.MALE, length: 'LONG', texture: 'STRAIGHT' },

  // —— 女士 ——
  { code: 'f-bob', name: '波波头', category: '短发', gender: Gender.FEMALE, length: 'SHORT', texture: 'STRAIGHT' },
  { code: 'f-short-bob', name: '齐耳短发', category: '短发', gender: Gender.FEMALE, length: 'SHORT', texture: 'STRAIGHT' },
  { code: 'f-lob', name: '锁骨发', category: '中长发', gender: Gender.FEMALE, length: 'MEDIUM', texture: 'STRAIGHT' },
  { code: 'f-long-straight', name: '黑长直', category: '长发', gender: Gender.FEMALE, length: 'LONG', texture: 'STRAIGHT' },
  { code: 'f-big-wave', name: '大波浪', category: '长发', gender: Gender.FEMALE, length: 'LONG', texture: 'WAVY' },
  { code: 'f-water-wave', name: '水波纹', category: '长发', gender: Gender.FEMALE, length: 'LONG', texture: 'WAVY' },
  { code: 'f-curtain-bangs', name: '法式刘海', category: '中长发', gender: Gender.FEMALE, length: 'MEDIUM', texture: 'STRAIGHT' },
  { code: 'f-air-bangs', name: '空气刘海', category: '中长发', gender: Gender.FEMALE, length: 'MEDIUM', texture: 'STRAIGHT' },
  { code: 'f-pixie', name: '精灵短发', category: '短发', gender: Gender.FEMALE, length: 'SHORT', texture: 'STRAIGHT' },
  { code: 'f-layered-long', name: '高层次长发', category: '长发', gender: Gender.FEMALE, length: 'LONG', texture: 'WAVY' },
  { code: 'f-curly-short', name: '羊毛卷短发', category: '短发', gender: Gender.FEMALE, length: 'SHORT', texture: 'CURLY' },

  // —— 中性 ——
  { code: 'u-bowl-cut', name: '齐刘海短发', category: '短发', gender: Gender.UNISEX, length: 'SHORT', texture: 'STRAIGHT' },
  { code: 'u-mullet', name: '鲻鱼头', category: '中长发', gender: Gender.UNISEX, length: 'MEDIUM', texture: 'WAVY' },
  { code: 'u-shaved-side', name: '两侧铲青', category: '短发', gender: Gender.UNISEX, length: 'SHORT', texture: 'STRAIGHT' },
];

async function main(): Promise<void> {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('缺少 DATABASE_URL —— 先复制 .env.example 为 .env');
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    // sortOrder 用数组下标，保证目录顺序与这份清单一致 ——
    // 想让某个发型靠前，直接把它往数组上面挪就行
    let created = 0;
    let updated = 0;

    for (const [index, item] of HAIRSTYLES.entries()) {
      const existing = await prisma.hairstyle.findUnique({ where: { code: item.code } });
      await prisma.hairstyle.upsert({
        where: { code: item.code },
        create: { ...item, sortOrder: index, active: true },
        // 不覆盖 referenceImage：那是运维后续传图时写进去的，别被种子刷掉
        update: {
          name: item.name,
          category: item.category,
          gender: item.gender,
          length: item.length,
          texture: item.texture,
          sortOrder: index,
        },
      });
      if (existing) updated += 1;
      else created += 1;
    }

    console.log(`✅ 发型目录已同步：新增 ${created} 条，更新 ${updated} 条，共 ${HAIRSTYLES.length} 条`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();