/**
 * AI 供应商统一接口。
 *
 * 架构约束（server-architecture.md §4/§5）：simulations 模块只依赖这个接口，
 * 绝不直接写死某个供应商。换供应商 = 换环境变量 AI_PROVIDER，业务代码零改动。
 *
 * ⚠️ 这个接口的**最终形态**按架构文档 §11 是留给创始人的议题：
 * 字段够不够、要不要拆更细（比如把「检测」和「生成」拆成两个接口），
 * 等你读完文档后一起定。当前版本以「Mock 能跑通全链路」为准则。
 */

/** 供应商入参。刻意同时给 URL 和 storageKey，两者用途不同。 */
export interface ProviderImageInput {
  /**
   * 稳定标识（对象存储里的 key）。
   * 真实供应商用它没用，但 Mock 用它派生确定性随机数 ——
   * 预签名 URL 每次都变，拿 URL 做种子会导致同一张图结果不稳定。
   */
  storageKey: string;
  /** 可直接下载的地址。真实供应商（Perfect Corp / Gemini）多数接受 URL。 */
  imageUrl: string;
  contentType?: string;
}

/** 发质分析结果。字段全部可选：不同供应商能给的粒度不一样。 */
export interface HairAnalysis {
  hairType?: string;
  hairLength?: string;
  hairDensity?: string;
  hairFrizziness?: string;
  /** 供应商原始响应，原样存进 appearance_profiles.raw */
  raw: unknown;
}

/** 面部特征。Phase 1 只关心脸型。 */
export interface FaceAnalysis {
  faceShape?: string;
  raw: unknown;
}

export interface GenerateHairstyleInput {
  source: ProviderImageInput;
  /** 供应商侧的发型 ID。没有 ID 体系的供应商会忽略它。 */
  providerStyleId?: string;
  /** 发型名称，作为没有 ID 时的兜底描述 */
  hairstyleName: string;
  /** 已经分析出的画像，供供应商参考（也可能为空 —— 用户跳过分析时） */
  appearance?: {
    faceShape?: string;
    hairType?: string;
    hairLength?: string;
  };
}

/** 用量与成本。写进 ai_usages 表，是 BUY→BUILD 决策的依据（§56）。 */
export interface ProviderUsage {
  model?: string;
  latencyMs: number;
  /** 估算成本，单位美元。Mock 恒为 0。 */
  estimatedCost?: number;
  inputBytes?: number;
  outputBytes?: number;
}

export interface GenerationResult {
  /** 结果图字节。放哪里由调用方决定，Provider 不碰对象存储。 */
  image: Buffer;
  contentType: string;
  usage: ProviderUsage;
  raw?: unknown;
}

export interface HairstyleProvider {
  /** 写进 ai_tasks.provider，也用于日志与成本归集 */
  readonly name: string;

  /** 发质 / 发长 / 发量 / 毛躁度检测 */
  analyzeHair(input: ProviderImageInput): Promise<HairAnalysis>;

  /** 脸型等面部特征 */
  analyzeFace(input: ProviderImageInput): Promise<FaceAnalysis>;

  /** 发型虚拟试戴（核心能力） */
  generateHairstyle(input: GenerateHairstyleInput): Promise<GenerationResult>;
}

/**
 * DI 令牌。
 * 用 Symbol 而不是字符串或具体类，是为了让 simulations 在编译期就无法
 * 引用到具体实现 —— 依赖倒置在这个项目里的落地方式。
 */
export const HAIRSTYLE_PROVIDER = Symbol('HAIRSTYLE_PROVIDER');