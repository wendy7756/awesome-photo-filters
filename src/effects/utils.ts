import type { EffectContext } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function mixValue(original: number, filtered: number, amount: number): number {
  return lerp(original, filtered, amount);
}

export function luminance(r: number, g: number, b: number): number {
  return r * 0.299 + g * 0.587 + b * 0.114;
}

export function intensityAmount(intensity: number): number {
  return intensity / 100;
}

export function drawSource({ source, ctx, width, height }: EffectContext): void {
  ctx.drawImage(source, 0, 0, width, height);
}

export function readPixels(ctx: EffectContext): ImageData {
  return ctx.ctx.getImageData(0, 0, ctx.width, ctx.height);
}

export function writePixels(ctx: EffectContext, imageData: ImageData): void {
  ctx.ctx.putImageData(imageData, 0, 0);
}

export function sampleBilinear(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number
): [number, number, number, number] {
  const px = clamp(x, 0, width - 1);
  const py = clamp(y, 0, height - 1);
  const x0 = Math.floor(px);
  const y0 = Math.floor(py);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  const tx = px - x0;
  const ty = py - y0;

  const i00 = (y0 * width + x0) * 4;
  const i10 = (y0 * width + x1) * 4;
  const i01 = (y1 * width + x0) * 4;
  const i11 = (y1 * width + x1) * 4;

  const sample = (offset: number) =>
    (1 - tx) * (1 - ty) * data[i00 + offset] +
    tx * (1 - ty) * data[i10 + offset] +
    (1 - tx) * ty * data[i01 + offset] +
    tx * ty * data[i11 + offset];

  return [sample(0), sample(1), sample(2), 255];
}

export function blendPixel(
  data: Uint8ClampedArray,
  index: number,
  r: number,
  g: number,
  b: number,
  amount: number
): void {
  data[index] = mixValue(data[index], r, amount);
  data[index + 1] = mixValue(data[index + 1], g, amount);
  data[index + 2] = mixValue(data[index + 2], b, amount);
}

export function tempCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d")!;
  return [canvas, context];
}

export function remapPixels(
  ctx: EffectContext,
  mapFn: (x: number, y: number, width: number, height: number) => [number, number]
): void {
  drawSource(ctx);
  const source = readPixels(ctx);
  const { width, height } = ctx;
  const output = ctx.ctx.createImageData(width, height);
  const src = source.data;
  const dst = output.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [sx, sy] = mapFn(x, y, width, height);
      const [r, g, b] = sampleBilinear(src, width, height, sx, sy);
      const i = (y * width + x) * 4;
      dst[i] = r;
      dst[i + 1] = g;
      dst[i + 2] = b;
      dst[i + 3] = 255;
    }
  }

  writePixels(ctx, output);
}
