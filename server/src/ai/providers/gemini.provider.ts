import { Injectable, Logger } from '@nestjs/common';
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
 * Google Gemini —— 架构文档 ADR-008 的第二候选。
 *
 * 与 Perfect Corp 的区别值得注意：Gemini 是通用多模态模型，不是专门的
 * 试戴引擎。它做「分析」可能够用，但「生成指定发型的试戴图」大概率需要
 * 走图像编辑/生成路径，效果与成本都要重新评估 —— 这正是 §29 Benchmark
 * 要回答的问题，不要凭直觉选。
 *
 * 当前是占位实现，方法一律显式抛错（理由同 perfect-corp.provider.ts）。
 */
@Injectable()
export class GeminiProvider implements HairstyleProvider {
  readonly name = 'gemini';

  private readonly logger = new Logger(GeminiProvider.name);

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
    this.logger.error(`GeminiProvider.${method} 尚未接入（key=${storageKey}）`);
    return new AppError(
      'AI_PROVIDER_UNAVAILABLE',
      'Gemini 供应商尚未接入，请把 AI_PROVIDER 切回 mock，或先完成 provider 实现',
    );
  }
}