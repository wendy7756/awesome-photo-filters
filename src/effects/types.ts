export interface EffectContext {
  source: HTMLImageElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  intensity: number;
}

interface EffectBase {
  id: string;
  name: string;
  description: string;
  defaultIntensity?: number;
}

export interface LocalEffect extends EffectBase {
  kind: "local";
  apply: (context: EffectContext) => void;
}

export interface AiEffect extends EffectBase {
  kind: "ai";
  /** Primary generation prompt (abstract panel only for editorial). */
  prompt: string;
  /** Full artwork prompt when a second composite generation is required. */
  compositePrompt?: string;
  sourceUrl?: string;
  requiresImageInput?: boolean;
}

/** Browser-based video effect (upload video → process → export). */
export interface VideoEffect extends EffectBase {
  kind: "video";
  sourceUrl?: string;
}

export type VisualEffect = LocalEffect | AiEffect | VideoEffect;

export function isAiEffect(effect: VisualEffect): effect is AiEffect {
  return effect.kind === "ai";
}

export function isLocalEffect(effect: VisualEffect): effect is LocalEffect {
  return effect.kind === "local";
}

export function isVideoEffect(effect: VisualEffect): effect is VideoEffect {
  return effect.kind === "video";
}
