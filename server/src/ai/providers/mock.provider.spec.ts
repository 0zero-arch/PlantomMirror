import { describe, expect, it } from 'vitest';
import { MockProvider } from './mock.provider.js';

/**
 * MockProvider 的测试不依赖任何外部设施（无 DB、无 MinIO、无网络）——
 * 这是刻意的：Mock 存在的意义就是让全链路能在零依赖、零成本下被验证，
 * 如果它自己的测试都需要先起一套基础设施，那这个意义就没了。
 *
 * 重点验证「确定性」：同一张照片必须永远得到同一份画像。
 * 一旦哪天有人往 Mock 里加了 Math.random()，这些用例会立刻红。
 */
describe('MockProvider', () => {
  const provider = new MockProvider();

  const input = {
    storageKey: 'photos/user-1/photo-1.jpg',
    imageUrl: 'http://127.0.0.1:9000/phantommirror/photos/user-1/photo-1.jpg?X-Amz-Signature=abc',
  };

  it('同一张照片的分析结果稳定可复现', async () => {
    const first = await provider.analyzeHair(input);
    const second = await provider.analyzeHair(input);
    expect(first).toEqual(second);
  });

  it('同一张照片的脸型结果稳定可复现', async () => {
    const first = await provider.analyzeFace(input);
    const second = await provider.analyzeFace(input);
    expect(first).toEqual(second);
  });

  it('不同照片得到不同结果', async () => {
    const other = { ...input, storageKey: 'photos/user-1/photo-2.jpg' };
    const a = await provider.analyzeFace(input);
    const b = await provider.analyzeFace(other);
    // 极小概率撞上同一个脸型，所以断言 raw.confidence 不同更可靠
    expect(a.raw).not.toEqual(b.raw);
  });

  it('分析结果字段齐全，客户端无需为 Mock 写特判', async () => {
    const hair = await provider.analyzeHair(input);
    expect(hair.hairType).toBeTruthy();
    expect(hair.hairLength).toBeTruthy();
    expect(hair.hairDensity).toBeTruthy();
    expect(hair.hairFrizziness).toBeTruthy();
    expect(await provider.analyzeFace(input)).toHaveProperty('faceShape');
  });

  it('结果图是一张合法的 PNG', async () => {
    const result = await provider.generateHairstyle({
      source: input,
      hairstyleName: '短发',
      providerStyleId: 'style-short-01',
    });

    expect(result.contentType).toBe('image/png');
    // PNG 魔数
    expect(result.image.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    // 至少要有 IHDR/IDAT/IEND 三个 chunk 的体量
    expect(result.image.length).toBeGreaterThan(100);
  });

  it('Mock 不产生任何 AI 成本', async () => {
    const result = await provider.generateHairstyle({
      source: input,
      hairstyleName: '短发',
      providerStyleId: 'style-short-01',
    });
    expect(result.usage.estimatedCost).toBe(0);
    expect(result.usage.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('同一个发型生成同一张结果图', async () => {
    const args = { source: input, hairstyleName: '短发', providerStyleId: 'style-short-01' };
    const a = await provider.generateHairstyle(args);
    const b = await provider.generateHairstyle(args);
    expect(a.image.equals(b.image)).toBe(true);
  });
});