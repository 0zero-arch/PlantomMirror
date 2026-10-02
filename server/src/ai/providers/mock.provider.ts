import { Injectable, Logger } from '@nestjs/common';
import type {
  FaceAnalysis,
  GenerateHairstyleInput,
  GenerationResult,
  HairAnalysis,
  HairstyleProvider,
  ProviderImageInput,
} from '../hairstyle-provider.interface.js';
import { renderPlaceholderPng } from './placeholder-image.js';

/**
 * 零成本 Mock Provider（架构文档 §5.2）。
 *
 * 设计原则：**返回结构真实、内容假**。
 *  - 字段齐全（脸型 / 发质 / 发长 / 发量 / 毛躁度），客户端不需要为 Mock
 *    写任何特判分支；
 *  - 值由 storageKey 派生的确定性伪随机数决定 —— 同一张照片永远得到同一份
 *    画像，测试才能断言，用户重试也不会看到结果乱跳；
 *  - 结果图是一张合成 PNG（尺寸/色调由发型决定），让客户端的前后对比滑块
 *    有东西可显示。
 *
 * 由此，整条闭环（上传 → 分析 → 选发型 → 模拟 → 结果 → 反馈）
 * 在**不花一分钱 AI 费用**的前提下端到端跑通。
 *
 * 它不注入 StorageService：字节进、字节出，放哪里由 simulations 决定。
 * 保持这个边界，将来换成真实 Provider 时替换成本最低。
 */
@Injectable()
export class MockProvider implements HairstyleProvider {
  readonly name = 'mock';

  private readonly logger = new Logger(MockProvider.name);

  private static readonly FACE_SHAPES = ['oval', 'round', 'square', 'heart', 'oblong', 'diamond'];
  private static readonly HAIR_TYPES = ['straight', 'wavy', 'curly', 'coily'];
  private static readonly HAIR_LENGTHS = ['short', 'medium', 'long'];
  private static readonly LEVELS = ['low', 'medium', 'high'];

  async analyzeHair(input: ProviderImageInput): Promise<HairAnalysis> {
    const rand = deterministicRandom(`${input.storageKey}:hair`);
    const result: HairAnalysis = {
      hairType: pick(MockProvider.HAIR_TYPES, rand),
      hairLength: pick(MockProvider.HAIR_LENGTHS, rand),
      hairDensity: pick(MockProvider.LEVELS, rand),
      hairFrizziness: pick(MockProvider.LEVELS, rand),
      // raw 的形状刻意模仿真实供应商的响应结构，方便将来对齐字段。
      // 注意：这里**不能**放时间戳之类的易变值 —— 一旦引入，同一张照片
      // 两次调用就会得到不同结果，Mock 的「确定性」承诺即被破坏。
      // （这个坑是被 mock.provider.spec.ts 的确定性用例抓出来的。）
      raw: {
        provider: 'mock',
        note: '合成数据，非真实检测结果',
        confidence: round(0.6 + rand() * 0.35, 2),
      },
    };
    this.logger.debug(`Mock 发质分析完成 key=${input.storageKey}`);
    return result;
  }

  async analyzeFace(input: ProviderImageInput): Promise<FaceAnalysis> {
    const rand = deterministicRandom(`${input.storageKey}:face`);
    return {
      faceShape: pick(MockProvider.FACE_SHAPES, rand),
      raw: {
        provider: 'mock',
        note: '合成数据，非真实检测结果',
        confidence: round(0.6 + rand() * 0.35, 2),
      },
    };
  }

  async generateHairstyle(input: GenerateHairstyleInput): Promise<GenerationResult> {
    const startedAt = Date.now();
    const seed = fnv1a(input.source.storageKey);
    // 同一个发型永远同一色调，方便肉眼确认「换发型确实换了东西」
    const hue = fnv1a(input.hairstyleName) % 360;

    const image = renderPlaceholderPng({ width: 768, height: 1024, seed, hue });

    this.logger.debug(`Mock 试戴生成完成 hairstyle=${input.hairstyleName} (${image.length} bytes)`);

    return {
      image,
      contentType: 'image/png',
      usage: {
        model: 'mock-v1',
        latencyMs: Date.now() - startedAt,
        estimatedCost: 0,
        outputBytes: image.length,
      },
      raw: {
        provider: 'mock',
        note: '占位结果图，非真实试戴效果',
        hairstyleName: input.hairstyleName,
        providerStyleId: input.providerStyleId ?? null,
      },
    };
  }
}

// ---------------------------------------------------------------- 确定性随机

/** FNV-1a：把字符串折成 32 位无符号整数，作为 PRNG 种子。 */
function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32：短小、分布够用、无外部依赖。 */
function deterministicRandom(seedText: string): () => number {
  let a = fnv1a(seedText);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: readonly T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length) % items.length]!;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}