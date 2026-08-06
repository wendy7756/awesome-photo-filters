import type { VisualEffect } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const grayscaleEffect: VisualEffect = {
  kind: "local",
  id: "grayscale",
  name: "Grayscale",
  description: "Classic black and white.",
  defaultIntensity: 100,
  apply({ source, ctx, width, height, intensity }) {
    ctx.drawImage(source, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const amount = intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = data[i] + (gray - data[i]) * amount;
      data[i + 1] = data[i + 1] + (gray - data[i + 1]) * amount;
      data[i + 2] = data[i + 2] + (gray - data[i + 2]) * amount;
    }

    ctx.putImageData(imageData, 0, 0);
  },
};

export const sepiaEffect: VisualEffect = {
  kind: "local",
  id: "sepia",
  name: "Sepia",
  description: "Warm vintage film tone.",
  defaultIntensity: 100,
  apply({ source, ctx, width, height, intensity }) {
    ctx.drawImage(source, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const amount = intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const sr = clamp(r * 0.393 + g * 0.769 + b * 0.189, 0, 255);
      const sg = clamp(r * 0.349 + g * 0.686 + b * 0.168, 0, 255);
      const sb = clamp(r * 0.272 + g * 0.534 + b * 0.131, 0, 255);
      data[i] = r + (sr - r) * amount;
      data[i + 1] = g + (sg - g) * amount;
      data[i + 2] = b + (sb - b) * amount;
    }

    ctx.putImageData(imageData, 0, 0);
  },
};

export const invertEffect: VisualEffect = {
  kind: "local",
  id: "invert",
  name: "Invert",
  description: "Negative color inversion.",
  defaultIntensity: 100,
  apply({ source, ctx, width, height, intensity }) {
    ctx.drawImage(source, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const amount = intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = data[i] + (255 - data[i] * 2) * amount;
      data[i + 1] = data[i + 1] + (255 - data[i + 1] * 2) * amount;
      data[i + 2] = data[i + 2] + (255 - data[i + 2] * 2) * amount;
    }

    ctx.putImageData(imageData, 0, 0);
  },
};

export const blurEffect: VisualEffect = {
  kind: "local",
  id: "blur",
  name: "Blur",
  description: "Soft, gentle blur.",
  defaultIntensity: 35,
  apply({ source, ctx, width, height, intensity }) {
    const radius = (intensity / 100) * 12;
    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(source, 0, 0, width, height);
    ctx.filter = "none";
  },
};

export const vignetteEffect: VisualEffect = {
  kind: "local",
  id: "vignette",
  name: "Vignette",
  description: "Darkened edges for focus.",
  defaultIntensity: 55,
  apply({ source, ctx, width, height, intensity }) {
    ctx.drawImage(source, 0, 0, width, height);
    const amount = intensity / 100;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.sqrt(cx * cx + cy * cy);
    const gradient = ctx.createRadialGradient(cx, cy, radius * 0.35, cx, cy, radius);
    gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${0.75 * amount})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  },
};

export const duotoneEffect: VisualEffect = {
  kind: "local",
  id: "duotone",
  name: "Duotone",
  description: "Two-color stylized look.",
  defaultIntensity: 100,
  apply({ source, ctx, width, height, intensity }) {
    ctx.drawImage(source, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const amount = intensity / 100;
    const shadow = [20, 24, 82];
    const highlight = [255, 107, 74];

    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      const r = shadow[0] + (highlight[0] - shadow[0]) * gray;
      const g = shadow[1] + (highlight[1] - shadow[1]) * gray;
      const b = shadow[2] + (highlight[2] - shadow[2]) * gray;
      data[i] = data[i] + (r - data[i]) * amount;
      data[i + 1] = data[i + 1] + (g - data[i + 1]) * amount;
      data[i + 2] = data[i + 2] + (b - data[i + 2]) * amount;
    }

    ctx.putImageData(imageData, 0, 0);
  },
};

export const pixelateEffect: VisualEffect = {
  kind: "local",
  id: "pixelate",
  name: "Pixelate",
  description: "Retro pixel mosaic.",
  defaultIntensity: 45,
  apply({ source, ctx, width, height, intensity }) {
    const blockSize = Math.max(2, Math.round((intensity / 100) * 24));
    const offscreen = document.createElement("canvas");
    offscreen.width = Math.max(1, Math.floor(width / blockSize));
    offscreen.height = Math.max(1, Math.floor(height / blockSize));
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    offCtx.imageSmoothingEnabled = false;
    offCtx.drawImage(source, 0, 0, offscreen.width, offscreen.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreen, 0, 0, offscreen.width, offscreen.height, 0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
  },
};
