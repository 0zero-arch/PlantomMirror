import { deflateSync } from 'node:zlib';

/**
 * 极简 PNG 编码器（真彩 RGB，无压缩优化以外的花活）。
 *
 * 为什么手写而不是装个 sharp/canvas：
 *  - sharp 带原生二进制，几十 MB，而我们只需要「画一张能看的占位图」；
 *  - 手写 ~50 行、零依赖，且离线可用。
 * 一旦接入真实 Provider，这个文件就可以删掉。
 */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) {
    c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([length, typed, crc]);
}

export interface PlaceholderOptions {
  width: number;
  height: number;
  /** 同一个 seed 永远得到同一张图 —— Mock 结果必须可复现 */
  seed: number;
  /** 0-360，由调用方按发型决定，让不同发型颜色不同 */
  hue: number;
}

export function renderPlaceholderPng(options: PlaceholderOptions): Buffer {
  const { width, height, seed, hue } = options;

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // 每行开头一个 filter 字节（0 = None），后面跟 width*3 个 RGB 字节
  const raw = Buffer.alloc(height * (1 + width * 3));
  let offset = 0;
  const [baseR, baseG, baseB] = hslToRgb(hue / 360, 0.45, 0.32);

  for (let y = 0; y < height; y += 1) {
    raw[offset] = 0;
    offset += 1;
    for (let x = 0; x < width; x += 1) {
      // 竖直渐变 + 一条斜向亮带，让前后对比滑块一拖动就能看出画面在变
      const gradient = 0.65 + 0.35 * (y / height);
      // (x + y + seed) % 周期 -> 斜纹
      const band = (x + y + seed) % 97 < 12 ? 1.35 : 1;
      raw[offset] = clamp(baseR * gradient * band);
      raw[offset + 1] = clamp(baseG * gradient * band);
      raw[offset + 2] = clamp(baseB * gradient * band);
      offset += 3;
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/** h/s/l 均为 0-1，返回 0-255 的 RGB。 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hueToRgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hueToRgb(p, q, h + 1 / 3) * 255, hueToRgb(p, q, h) * 255, hueToRgb(p, q, h - 1 / 3) * 255];
}