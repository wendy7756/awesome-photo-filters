import type { LocalEffect } from "./types";
import {
  clamp,
  drawSource,
  intensityAmount,
  readPixels,
  remapPixels,
  writePixels,
} from "./utils";

export const glitchEffect: LocalEffect = {
  kind: "local",
  id: "glitch",
  name: "Glitch",
  description: "RGB shift and slice offsets.",
  defaultIntensity: 50,
  apply(ctx) {
    drawSource(ctx);
    const amount = intensityAmount(ctx.intensity);
    const { width, height } = ctx;
    const base = readPixels(ctx);
    const data = base.data;
    const sliceHeight = Math.max(4, Math.round(12 - amount * 6));
    for (let y = 0; y < height; y += sliceHeight) {
      const shift = Math.round((Math.random() - 0.5) * amount * 30);
      const channelShift = Math.round(amount * 8);
      for (let x = 0; x < width; x++) {
        for (let row = y; row < Math.min(y + sliceHeight, height); row++) {
          const sx = clamp(x + shift, 0, width - 1);
          const i = (row * width + x) * 4;
          const ri = (row * width + clamp(sx - channelShift, 0, width - 1)) * 4;
          const bi = (row * width + clamp(sx + channelShift, 0, width - 1)) * 4;
          data[i] = base.data[ri];
          data[i + 2] = base.data[bi];
        }
      }
    }
    writePixels(ctx, base);
  },
};

export const chromaticAberrationEffect: LocalEffect = {
  kind: "local",
  id: "chromatic-aberration",
  name: "Chromatic Aberration",
  description: "Lens color fringing.",
  defaultIntensity: 35,
  apply(ctx) {
    drawSource(ctx);
    const amount = intensityAmount(ctx.intensity);
    const { width, height } = ctx;
    const base = readPixels(ctx);
    const data = base.data;
    const offset = Math.round(2 + amount * 10);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const ri = (y * width + clamp(x - offset, 0, width - 1)) * 4;
        const bi = (y * width + clamp(x + offset, 0, width - 1)) * 4;
        data[i] = base.data[ri];
        data[i + 2] = base.data[bi];
      }
    }
    writePixels(ctx, base);
  },
};

export const swirlEffect: LocalEffect = {
  kind: "local",
  id: "swirl",
  name: "Swirl",
  description: "Swirl distortion from center.",
  defaultIntensity: 50,
  apply(ctx) {
    const amount = intensityAmount(ctx.intensity);
    remapPixels(ctx, (x, y, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      const maxR = Math.sqrt(cx * cx + cy * cy);
      const angle = Math.atan2(dy, dx) - amount * 2.5 * (1 - r / maxR);
      return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
    });
  },
};

export const fisheyeEffect: LocalEffect = {
  kind: "local",
  id: "fisheye",
  name: "Fisheye",
  description: "Bulging lens distortion.",
  defaultIntensity: 35,
  apply(ctx) {
    const amount = intensityAmount(ctx.intensity);
    remapPixels(ctx, (x, y, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r >= 1) return [x, y];
      const zoom = 1 + amount * (1 - r * r);
      return [cx + dx * cx * zoom, cy + dy * cy * zoom];
    });
  },
};

export const kaleidoscopeEffect: LocalEffect = {
  kind: "local",
  id: "kaleidoscope",
  name: "Kaleidoscope",
  description: "Mirrored radial symmetry.",
  defaultIntensity: 65,
  apply(ctx) {
    const amount = intensityAmount(ctx.intensity);
    const segments = 6;
    remapPixels(ctx, (x, y, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const dx = x - cx;
      const dy = y - cy;
      let angle = Math.atan2(dy, dx);
      const r = Math.sqrt(dx * dx + dy * dy);
      const slice = (Math.PI * 2) / segments;
      angle = ((angle % slice) + slice) % slice;
      if (angle > slice / 2) angle = slice - angle;
      angle *= 1 + amount * 0.15;
      return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
    });
  },
};

export const mirrorEffect: LocalEffect = {
  kind: "local",
  id: "mirror",
  name: "Mirror",
  description: "Horizontal mirror repeat.",
  defaultIntensity: 100,
  apply(ctx) {
    const { width, height, source, ctx: canvasCtx } = ctx;
    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.drawImage(source, 0, 0, width / 2, height, 0, 0, width / 2, height);
    canvasCtx.save();
    canvasCtx.translate(width, 0);
    canvasCtx.scale(-1, 1);
    canvasCtx.drawImage(source, 0, 0, width / 2, height, 0, 0, width / 2, height);
    canvasCtx.restore();
  },
};

export const dreamGlowEffect: LocalEffect = {
  kind: "local",
  id: "dream-glow",
  name: "Dream Glow",
  description: "Soft luminous overlay.",
  defaultIntensity: 50,
  apply(ctx) {
    const amount = intensityAmount(ctx.intensity);
    const { width, height, source, ctx: canvasCtx } = ctx;
    canvasCtx.drawImage(source, 0, 0, width, height);
    canvasCtx.globalCompositeOperation = "screen";
    canvasCtx.globalAlpha = 0.35 + amount * 0.45;
    canvasCtx.filter = `blur(${4 + amount * 16}px)`;
    canvasCtx.drawImage(source, 0, 0, width, height);
    canvasCtx.filter = "none";
    canvasCtx.globalAlpha = 1;
    canvasCtx.globalCompositeOperation = "source-over";
  },
};

export const lensFlareEffect: LocalEffect = {
  kind: "local",
  id: "lens-flare",
  name: "Lens Flare",
  description: "Procedural light bloom.",
  defaultIntensity: 35,
  apply(ctx) {
    drawSource(ctx);
    const amount = intensityAmount(ctx.intensity);
    const { width, height, ctx: canvasCtx } = ctx;
    const cx = width * 0.72;
    const cy = height * 0.28;
    const gradient = canvasCtx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.45);
    gradient.addColorStop(0, `rgba(255, 240, 200, ${0.65 * amount})`);
    gradient.addColorStop(0.2, `rgba(255, 180, 100, ${0.25 * amount})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    canvasCtx.globalCompositeOperation = "screen";
    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(0, 0, width, height);
    canvasCtx.globalCompositeOperation = "source-over";
  },
};

export const lightLeakEffect: LocalEffect = {
  kind: "local",
  id: "light-leak",
  name: "Light Leak",
  description: "Warm corner light leak.",
  defaultIntensity: 50,
  apply(ctx) {
    drawSource(ctx);
    const amount = intensityAmount(ctx.intensity);
    const { width, height, ctx: canvasCtx } = ctx;
    const gradient = canvasCtx.createLinearGradient(0, height, width, 0);
    gradient.addColorStop(0, `rgba(255, 90, 40, ${0.45 * amount})`);
    gradient.addColorStop(0.45, `rgba(255, 180, 80, ${0.18 * amount})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    canvasCtx.globalCompositeOperation = "screen";
    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(0, 0, width, height);
    canvasCtx.globalCompositeOperation = "source-over";
  },
};
