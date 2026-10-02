import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../common/config/configuration.js';
import { HAIRSTYLE_PROVIDER, type HairstyleProvider } from './hairstyle-provider.interface.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { MockProvider } from './providers/mock.provider.js';
import { PerfectCorpProvider } from './providers/perfect-corp.provider.js';

/**
 * 通过环境变量的值把具体实现绑到 HAIRSTYLE_PROVIDER 令牌上。
 *
 * 这就是「换供应商业务代码零改动」的落地点：simulations 注入的是令牌，
 * 永远不知道背后是 Mock 还是 Perfect Corp。
 */
@Module({
  providers: [
    MockProvider,
    PerfectCorpProvider,
    GeminiProvider,
    {
      provide: HAIRSTYLE_PROVIDER,
      inject: [ConfigService, MockProvider, PerfectCorpProvider, GeminiProvider],
      useFactory: (
        config: ConfigService<AppConfiguration, true>,
        mock: MockProvider,
        perfectCorp: PerfectCorpProvider,
        gemini: GeminiProvider,
      ): HairstyleProvider => {
        const registry: Record<string, HairstyleProvider> = {
          mock,
          'perfect-corp': perfectCorp,
          gemini,
        };

        const selected = config.get('ai.provider', { infer: true });
        const provider = registry[selected];
        if (!provider) {
          // 宁可启动失败：一个拼错的 AI_PROVIDER 应该在启动时就暴露，
          // 而不是等到用户点了「开始试戴」才报错。
          throw new Error(
            `未知的 AI_PROVIDER="${selected}"，可选值：${Object.keys(registry).join(' | ')}`,
          );
        }
        return provider;
      },
    },
  ],
  exports: [HAIRSTYLE_PROVIDER],
})
export class AiModule {}