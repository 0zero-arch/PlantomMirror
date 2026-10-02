import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../../common/config/configuration.js';
import { AppError } from '../../common/errors/app-error.js';
import type {
  FaceAnalysis,
  GenerateHairstyleInput,
  GenerationResult,
  HairAnalysis,
  HairstyleProvider,
  ProviderImageInput,
} from '../hairstyle-provider.interface.js';

/**
 * Perfect Corp（玩美移动）—— 架构文档 ADR-008 的首选供应商。
 *
 * 当前是**占位实现**：方法一律显式抛错，不静默返回假数据。
 * 这是刻意的 —— 如果这里返回一个像模像样的假结果，将来误配
 * AI_PROVIDER=perfect-corp 时会得到查不出来的错误结果，比直接报错危险得多。
 *
 * 接入时要做的（架构文档 §11 列为创始人的议题）：
 *  1. 填 PERFECT_CORP_API_KEY，实现签名/鉴权头；
 *  2. 把供应商的字段映射到 HairAnalysis / FaceAnalysis（枚举值大概率不同）；
 *  3. 处理供应商的错误码 -> 映射成 AI_PROVIDER_FAILED / AI_PROVIDER_UNAVAILABLE，
 *     并据此设置 retryable（限流类错误应可重试，参数类错误不应重试）；
 *  4. 回填 usage.estimatedCost，让 ai_usages 的成本监控真的有意义。
 */
@Injectable()
export class PerfectCorpProvider implements HairstyleProvider {
  readonly name = 'perfect-corp';

  private readonly logger = new Logger(PerfectCorpProvider.name);

  constructor(private readonly config: ConfigService<AppConfiguration, true>) {}

  async analyzeHair(input: ProviderImageInput): Promise<HairAnalysis> {
    throw this.pending('analyzeHair', input.storageKey);
  }

  async analyzeFace(input: ProviderImageInput): Promise<FaceAnalysis> {
    throw this.pending('analyzeFace', input.storageKey);
  }

  async generateHairstyle(input: GenerateHairstyleInput): Promise<GenerationResult> {
    throw this.pending('generateHairstyle', input.source.storageKey);
  }

  private pending(method: string, storageKey: string): AppError {
    const configured = Boolean(this.config.get('ai.perfectCorpApiKey', { infer: true }));
    this.logger.error(
      `PerfectCorpProvider.${method} 尚未接入（key=${storageKey}，API Key 已配置=${configured}）`,
    );
    return new AppError(
      'AI_PROVIDER_UNAVAILABLE',
      'Perfect Corp 供应商尚未接入，请把 AI_PROVIDER 切回 mock，或先完成 provider 实现',
    );
  }
}