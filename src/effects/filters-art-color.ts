import type { LocalEffect } from "./types";
import {
  blendPixel,
  clamp,
  drawSource,
  intensityAmount,
  luminance,
  mixValue,
  readPixels,
  writePixels,
} from "./utils";

function sobelEdges(ctx: ReturnType<typeof readPixels>, width: number, height: number): Float32Array {
  const src = ctx.data;
  const edges = new Float32Array(width * height);
  const gxK = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ];
  const gyK = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const i = ((y + ky) * width + (x + kx)) * 4;
          const gray = luminance(src[i], src[i + 1], src[i + 2]);
          gx += gray * gxK[ky + 1][kx + 1];
          gy += gray * gyK[ky + 1][kx + 1];
        }
      }
      edges[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return edges;
}

export const sketchEffect: LocalEffect = {
  kind: "local",
  id: "sketch",
  name: "Sketch",
  description: "Pencil line drawing.",
  defaultIntensity: 70,
  apply(ctx) {
    drawSource(ctx);
    const amount = intensityAmount(ctx.intensity);
    const { width, height } = ctx;
    const source = readPixels(ctx);
    const edges = sobelEdges(source, width, height);
    const out = ctx.ctx.createImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const edge = clamp(edges[i] * 1.4, 0, 255);
      const v = mixValue(
        luminance(source.data[i * 4], source.data[i * 4 + 1], source.data[i * 4 + 2]),
        255 - edge,
        amount
      );
      const idx = i * 4;
      out.data[idx] = v;
      out.data[idx + 1] = v;
      out.data[idx + 2] = v;
      out.data[idx + 3] = 255;
    }
    writePixels(ctx, out);
  },
};

export const embossEffect: LocalEffect = {
  kind: "local",
  id: "emboss",
  name: "Emboss",
  description: "Raised relief shading.",
  defaultIntensity: 65,
  apply(ctx) {
    drawSource(ctx);
    const amount = intensityAmount(ctx.intensity);
    const { width, height } = ctx;
    const source = readPixels(ctx);
    const out = ctx.ctx.createImageData(width, height);
    const kernel = [
      [-2, -1, 0],
      [-1, 1, 1],
      [0, 1, 2],
    ];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const i = ((y + ky) * width + (x + kx)) * 4;
            sum += luminance(source.data[i], source.data[i + 1], source.data[i + 2]) * kernel[ky + 1][kx + 1];
          }
        }
        const v = clamp(128 + sum, 0, 255);
        const si = (y * width + x) * 4;
        const gray = luminance(source.data[si], source.data[si + 1], source.data[si + 2]);
        const nv = mixValue(gray, v, amount);
        out.data[si] = nv;
        out.data[si + 1] = nv;
        out.data[si + 2] = nv;
        out.data[si + 3] = 255;
      }
    }
    writePixels(ctx, out);
  },
};

export const oilPaintEffect: LocalEffect = {
  kind: "local",
  id: "oil-paint",
  name: "Oil Paint",
  description: "Simplified oil brush strokes.",
  defaultIntensity: 50,
  apply(ctx) {
    const amount = intensityAmount(ctx.intensity);
    const block = Math.max(2, Math.round(2 + amount * 6));
    const { width, height, source, ctx: canvasCtx } = ctx;
    const small = document.createElement("canvas");
    small.width = Math.max(1, Math.floor(width / block));
    small.height = Math.max(1, Math.floor(height / block));
    const sctx = small.getContext("2d")!;
    sctx.drawImage(source, 0, 0, small.width, small.height);
    canvasCtx.imageSmoothingEnabled = true;
    canvasCtx.filter = `blur(${amount * 1.5}px)`;
    canvasCtx.drawImage(small, 0, 0, small.width, small.height, 0, 0, width, height);
    canvasCtx.filter = "none";
    const imageData = readPixels(ctx);
    const data = imageData.data;
    const levels = Math.max(4, Math.round(10 - amount * 6));
    const step = 255 / levels;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(data[i] / step) * step;
      data[i + 1] = Math.round(data[i + 1] / step) * step;
      data[i + 2] = Math.round(data[i + 2] / step) * step;
    }
    writePixels(ctx, imageData);
  },
};

export const watercolorEffect: LocalEffect = {
  kind: "local",
  id: "watercolor",
  name: "Watercolor",
  description: "Soft bleed with dark edges.",
  defaultIntensity: 55,
  apply(ctx) {
    const amount = intensityAmount(ctx.intensity);
    ctx.ctx.filter = `blur(${amount * 2.5}px) saturate(${100 + amount * 40}%)`;
    drawSource(ctx);
    ctx.ctx.filter = "none";
    const { width, height } = ctx;
    const base = readPixels(ctx);
    const edges = sobelEdges(base, width, height);
    const data = base.data;
    for (let i = 0; i < width * height; i++) {
      const edge = clamp(edges[i] / 255, 0, 1) * amount * 0.45;
      const idx = i * 4;
      data[idx] = clamp(data[idx] * (1 - edge), 0, 255);
      data[idx + 1] = clamp(data[idx + 1] * (1 - edge), 0, 255);
      data[idx + 2] = clamp(data[idx + 2] * (1 - edge), 0, 255);
    }
    writePixels(ctx, base);
  },
};

export const crossHatchEffect: LocalEffect = {
  kind: "local",
  id: "cross-hatch",
  name: "Cross Hatch",
  description: "Cross-hatched pencil shading.",
  defaultIntensity: 65,
  apply(ctx) {
    drawSource(ctx);
    const amount = intensityAmount(ctx.intensity);
    const { width, height, ctx: canvasCtx } = ctx;
    const source = readPixels(ctx);
    canvasCtx.fillStyle = "#f7f4ec";
    canvasCtx.fillRect(0, 0, width, height);
    canvasCtx.strokeStyle = `rgba(26, 25, 21, ${0.35 + amount * 0.45})`;
    canvasCtx.lineWidth = 1;
    const spacing = Math.max(4, Math.round(10 - amount * 4));
    for (let y = 0; y < height; y += spacing) {
      for (let x = 0; x < width; x += spacing) {
        const i = (y * width + x) * 4;
        const gray = luminance(source.data[i], source.data[i + 1], source.data[i + 2]) / 255;
        if (gray > 0.75) continue;
        const density = (1 - gray) * amount;
        if (density < 0.15) continue;
        canvasCtx.beginPath();
        canvasCtx.moveTo(x, y);
        canvasCtx.lineTo(x + spacing, y + spacing);
        canvasCtx.stroke();
        if (density > 0.45) {
          canvasCtx.beginPath();
          canvasCtx.moveTo(x + spacing, y);
          canvasCtx.lineTo(x, y + spacing);
          canvasCtx.stroke();
        }
      }
    }
  },
};

export const thermalEffect: LocalEffect = {
  kind: "local",
  id: "thermal",
  name: "Thermal",
  description: "Heat-map false color.",
  defaultIntensity: 75,
  apply(ctx) {
    drawSource(ctx);
    const amount = intensityAmount(ctx.intensity);
    const imageData = readPixels(ctx);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const t = luminance(data[i], data[i + 1], data[i + 2]) / 255;
      let r = 0;
      let g = 0;
      let b = 0;
      if (t < 0.25) {
        r = 0;
        g = t * 4 * 180;
        b = 200 + t * 4 * 55;
      } else if (t < 0.5) {
        r = (t - 0.25) * 4 * 255;
        g = 180 + (t - 0.25) * 4 * 75;
        b = 255 - (t - 0.25) * 4 * 255;
      } else if (t < 0.75) {
        r = 255;
        g = 255 - (t - 0.5) * 4 * 120;
        b = 0;
      } else {
        r = 255;
        g = 255;
        b = (t - 0.75) * 4 * 255;
      }
      blendPixel(data, i, r, g, b, amount);
    }
    writePixels(ctx, imageData);
  },
};

export const nightVisionEffect: LocalEffect = {
  kind: "local",
  id: "night-vision",
  name: "Night Vision",
  description: "Green night-vision glow.",
  defaultIntensity: 70,
  apply(ctx) {
    drawSource(ctx);
    const amount = intensityAmount(ctx.intensity);
    const imageData = readPixels(ctx);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = luminance(data[i], data[i + 1], data[i + 2]);
      const g = clamp(gray * 1.15 + 12, 0, 255);
      blendPixel(data, i, g * 0.35, g, g * 0.45, amount);
    }
    writePixels(ctx, imageData);
  },
};

export const colorSplashEffect: LocalEffect = {
  kind: "local",
  id: "color-splash",
  name: "Color Splash",
  description: "Keep dominant hue, gray the rest.",
  defaultIntensity: 70,
  apply(ctx) {
    drawSource(ctx);
    const amount = intensityAmount(ctx.intensity);
    const imageData = readPixels(ctx);
    const data = imageData.data;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    const count = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      sumR += data[i];
      sumG += data[i + 1];
      sumB += data[i + 2];
    }
    const avgR = sumR / count;
    const avgG = sumG / count;
    const avgB = sumB / count;
    for (let i = 0; i < data.length; i += 4) {
      const dr = data[i] - avgR;
      const dg = data[i + 1] - avgG;
      const db = data[i + 2] - avgB;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      const gray = luminance(data[i], data[i + 1], data[i + 2]);
      const keep = dist < 70 + (1 - amount) * 40;
      if (!keep) {
        blendPixel(data, i, gray, gray, gray, amount);
      }
    }
    writePixels(ctx, imageData);
  },
};

export const neonEffect: LocalEffect = {
  kind: "local",
  id: "neon",
  name: "Neon",
  description: "Saturated glow with deep shadows.",
  defaultIntensity: 55,
  apply(ctx) {
    drawSource(ctx);
    const amount = intensityAmount(ctx.intensity);
    const { width, height } = ctx;
    const imageData = readPixels(ctx);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      const boost = 1 + amount * 0.9;
      r = clamp(r * boost, 0, 255);
      g = clamp(g * boost, 0, 255);
      b = clamp(b * boost, 0, 255);
      const lum = luminance(r, g, b) / 255;
      const crush = Math.pow(lum, 1 + amount * 0.8);
      r = mixValue(r, r * crush, amount);
      g = mixValue(g, g * crush, amount);
      b = mixValue(b, b * crush, amount);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
    writePixels(ctx, imageData);
    const edges = sobelEdges(readPixels(ctx), width, height);
    const out = readPixels(ctx);
    for (let i = 0; i < width * height; i++) {
      const glow = clamp(edges[i] * amount * 0.35, 0, 80);
      const idx = i * 4;
      out.data[idx] = clamp(out.data[idx] + glow, 0, 255);
      out.data[idx + 1] = clamp(out.data[idx + 1] + glow * 0.5, 0, 255);
      out.data[idx + 2] = clamp(out.data[idx + 2] + glow, 0, 255);
    }
    writePixels(ctx, out);
  },
};

export const sunsetEffect: LocalEffect = {
  kind: "local",
  id: "sunset",
  name: "Sunset",
  description: "Warm golden-hour wash.",
  defaultIntensity: 50,
  apply(ctx) {
    drawSource(ctx);
    const amount = intensityAmount(ctx.intensity);
    const { width, height, ctx: canvasCtx } = ctx;
    const gradient = canvasCtx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `rgba(255, 140, 60, ${0.08 * amount})`);
    gradient.addColorStop(0.5, `rgba(255, 90, 90, ${0.18 * amount})`);
    gradient.addColorStop(1, `rgba(120, 40, 80, ${0.28 * amount})`);
    canvasCtx.globalCompositeOperation = "screen";
    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(0, 0, width, height);
    canvasCtx.globalCompositeOperation = "source-over";
  },
};
