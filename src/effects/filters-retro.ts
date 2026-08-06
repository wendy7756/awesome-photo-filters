import type { LocalEffect } from "./types";
import {
  blendPixel,
  clamp,
  drawSource,
  intensityAmount,
  luminance,
  mixValue,
  readPixels,
  tempCanvas,
  writePixels,
} from "./utils";

export const motionBlurEffect: LocalEffect = {
  kind: "local",
  id: "motion-blur",
  name: "Motion Blur",
  description: "Directional movement blur.",
  defaultIntensity: 45,
  apply(ctx) {
    const amount = intensityAmount(ctx.intensity);
    const steps = Math.max(2, Math.round(amount * 16));
    const distance = amount * 40;
    const { ctx: canvasCtx, width, height, source } = ctx;
    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.globalAlpha = 1 / steps;
    for (let i = 0; i < steps; i++) {
      canvasCtx.drawImage(source, (distance * i) / steps, 0, width, height);
    }
    canvasCtx.globalAlpha = 1;
  },
};

export const frostedGlassEffect: LocalEffect = {
  kind: "local",
  id: "frosted-glass",
  name: "Frosted Glass",
  description: "Blurred glass with grain.",
  defaultIntensity: 45,
  apply(ctx) {
    const amount = intensityAmount(ctx.intensity);
    const radius = amount * 10;
    ctx.ctx.filter = `blur(${radius}px)`;
    drawSource(ctx);
    ctx.ctx.filter = "none";
    const imageData = readPixels(ctx);
    const data = imageData.data;
    const noise = amount * 28;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * noise;
      data[i] = clamp(data[i] + n, 0, 255);
      data[i + 1] = clamp(data[i + 1] + n, 0, 255);
      data[i + 2] = clamp(data[i + 2] + n, 0, 255);
    }
    writePixels(ctx, imageData);
  },
};

export const filmGrainEffect: LocalEffect = {
  kind: "local",
  id: "film-grain",
  name: "Film Grain",
  description: "Analog film grain texture.",
  defaultIntensity: 40,
  apply(ctx) {
    drawSource(ctx);
    const amount = intensityAmount(ctx.intensity);
    const imageData = readPixels(ctx);
    const data = imageData.data;
    const strength = amount * 36;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * strength;
      data[i] = clamp(data[i] + n, 0, 255);
      data[i + 1] = clamp(data[i + 1] + n, 0, 255);
      data[i + 2] = clamp(data[i + 2] + n, 0, 255);
    }
    writePixels(ctx, imageData);
  },
};

export const halftoneEffect: LocalEffect = {
  kind: "local",
  id: "halftone",
  name: "Halftone",
  description: "Newspaper dot pattern.",
  defaultIntensity: 60,
  apply(ctx) {
    const amount = intensityAmount(ctx.intensity);
    drawSource(ctx);
    const source = readPixels(ctx);
    const { width, height, ctx: canvasCtx } = ctx;
    const cell = Math.max(4, Math.round(8 + (1 - amount) * 10));
    canvasCtx.fillStyle = "#f5f1e8";
    canvasCtx.fillRect(0, 0, width, height);
    canvasCtx.fillStyle = "#1a1915";

    for (let y = 0; y < height; y += cell) {
      for (let x = 0; x < width; x += cell) {
        let sum = 0;
        let count = 0;
        for (let py = y; py < Math.min(y + cell, height); py++) {
          for (let px = x; px < Math.min(x + cell, width); px++) {
            const i = (py * width + px) * 4;
            sum += luminance(source.data[i], source.data[i + 1], source.data[i + 2]);
            count++;
          }
        }
        const avg = sum / count / 255;
        const radius = (cell * 0.5 * (1 - avg) + 0.5) * amount + (cell * 0.15 * (1 - amount));
        canvasCtx.beginPath();
        canvasCtx.arc(x + cell / 2, y + cell / 2, radius, 0, Math.PI * 2);
        canvasCtx.fill();
      }
    }
  },
};

export const posterizeEffect: LocalEffect = {
  kind: "local",
  id: "posterize",
  name: "Posterize",
  description: "Flat color poster look.",
  defaultIntensity: 65,
  apply(ctx) {
    drawSource(ctx);
    const amount = intensityAmount(ctx.intensity);
    const levels = Math.max(2, Math.round(8 - amount * 6));
    const step = 255 / (levels - 1);
    const imageData = readPixels(ctx);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(data[i] / step) * step;
      data[i + 1] = Math.round(data[i + 1] / step) * step;
      data[i + 2] = Math.round(data[i + 2] / step) * step;
    }
    writePixels(ctx, imageData);
  },
};

export const crossProcessEffect: LocalEffect = {
  kind: "local",
  id: "cross-process",
  name: "Cross Process",
  description: "Cross-processed film tones.",
  defaultIntensity: 65,
  apply(ctx) {
    drawSource(ctx);
    const amount = intensityAmount(ctx.intensity);
    const imageData = readPixels(ctx);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const nr = clamp(r * 1.12 + g * 0.08 - 10, 0, 255);
      const ng = clamp(g * 0.92 + b * 0.18, 0, 255);
      const nb = clamp(b * 1.18 - r * 0.08 + 12, 0, 255);
      blendPixel(data, i, nr, ng, nb, amount);
    }
    writePixels(ctx, imageData);
  },
};

export const bleachBypassEffect: LocalEffect = {
  kind: "local",
  id: "bleach-bypass",
  name: "Bleach Bypass",
  description: "High-contrast desaturated film.",
  defaultIntensity: 65,
  apply(ctx) {
    drawSource(ctx);
    const amount = intensityAmount(ctx.intensity);
    const imageData = readPixels(ctx);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = luminance(r, g, b);
      const contrast = clamp((gray - 128) * 1.35 + 128, 0, 255);
      const nr = mixValue(r, mixValue(r, contrast, 0.55), amount);
      const ng = mixValue(g, mixValue(g, contrast, 0.55), amount);
      const nb = mixValue(b, mixValue(b, contrast, 0.55), amount);
      data[i] = nr;
      data[i + 1] = ng;
      data[i + 2] = nb;
    }
    writePixels(ctx, imageData);
  },
};

export const oldTvEffect: LocalEffect = {
  kind: "local",
  id: "old-tv",
  name: "Old TV",
  description: "Scanlines and slight warp.",
  defaultIntensity: 55,
  apply(ctx) {
    const amount = intensityAmount(ctx.intensity);
    const { width, height, source, ctx: canvasCtx } = ctx;
    const [, bufferCtx] = tempCanvas(width, height);
    bufferCtx.drawImage(source, 0, 0, width, height);
    const warped = bufferCtx.getImageData(0, 0, width, height);
    const out = canvasCtx.createImageData(width, height);
    const amp = amount * 3;
    for (let y = 0; y < height; y++) {
      const shift = Math.sin(y * 0.08) * amp;
      for (let x = 0; x < width; x++) {
        const sx = clamp(Math.round(x + shift), 0, width - 1);
        const si = (y * width + sx) * 4;
        const di = (y * width + x) * 4;
        out.data[di] = warped.data[si];
        out.data[di + 1] = warped.data[si + 1];
        out.data[di + 2] = warped.data[si + 2];
        out.data[di + 3] = 255;
      }
    }
    canvasCtx.putImageData(out, 0, 0);
    canvasCtx.fillStyle = `rgba(0, 0, 0, ${0.22 * amount})`;
    for (let y = 0; y < height; y += 3) {
      canvasCtx.fillRect(0, y, width, 1);
    }
  },
};

export const vhsEffect: LocalEffect = {
  kind: "local",
  id: "vhs",
  name: "VHS",
  description: "Chroma bleed, noise, and soft blur.",
  defaultIntensity: 55,
  apply(ctx) {
    const amount = intensityAmount(ctx.intensity);
    const { width, height, source, ctx: canvasCtx } = ctx;
    canvasCtx.filter = `blur(${amount * 1.2}px)`;
    canvasCtx.drawImage(source, 0, 0, width, height);
    canvasCtx.filter = "none";
    const base = readPixels(ctx);
    const data = base.data;
    const offset = Math.round(amount * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const ri = (y * width + clamp(x - offset, 0, width - 1)) * 4;
        const bi = (y * width + clamp(x + offset, 0, width - 1)) * 4;
        data[i] = data[ri];
        data[i + 2] = data[bi];
        const n = (Math.random() - 0.5) * amount * 24;
        data[i] = clamp(data[i] + n, 0, 255);
        data[i + 1] = clamp(data[i + 1] + n, 0, 255);
        data[i + 2] = clamp(data[i + 2] + n, 0, 255);
      }
    }
    writePixels(ctx, base);
  },
};
