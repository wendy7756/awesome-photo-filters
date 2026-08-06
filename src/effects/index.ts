import { aiEffects } from "./ai-effects";
import {
  blurEffect,
  duotoneEffect,
  grayscaleEffect,
  invertEffect,
  pixelateEffect,
  sepiaEffect,
  vignetteEffect,
} from "./builtins";
import {
  colorSplashEffect,
  crossHatchEffect,
  embossEffect,
  neonEffect,
  nightVisionEffect,
  oilPaintEffect,
  sketchEffect,
  sunsetEffect,
  thermalEffect,
  watercolorEffect,
} from "./filters-art-color";
import {
  chromaticAberrationEffect,
  dreamGlowEffect,
  fisheyeEffect,
  glitchEffect,
  kaleidoscopeEffect,
  lensFlareEffect,
  lightLeakEffect,
  mirrorEffect,
  swirlEffect,
} from "./filters-distort-light";
import {
  bleachBypassEffect,
  crossProcessEffect,
  filmGrainEffect,
  frostedGlassEffect,
  halftoneEffect,
  motionBlurEffect,
  oldTvEffect,
  posterizeEffect,
  vhsEffect,
} from "./filters-retro";
import type { VisualEffect } from "./types";

export const localEffects: VisualEffect[] = [
  grayscaleEffect,
  sepiaEffect,
  duotoneEffect,
  vignetteEffect,
  blurEffect,
  pixelateEffect,
  invertEffect,
  motionBlurEffect,
  frostedGlassEffect,
  filmGrainEffect,
  halftoneEffect,
  posterizeEffect,
  crossProcessEffect,
  bleachBypassEffect,
  oldTvEffect,
  vhsEffect,
  sketchEffect,
  embossEffect,
  oilPaintEffect,
  watercolorEffect,
  crossHatchEffect,
  thermalEffect,
  nightVisionEffect,
  colorSplashEffect,
  neonEffect,
  sunsetEffect,
  glitchEffect,
  chromaticAberrationEffect,
  swirlEffect,
  fisheyeEffect,
  kaleidoscopeEffect,
  mirrorEffect,
  dreamGlowEffect,
  lensFlareEffect,
  lightLeakEffect,
];

export const effects: VisualEffect[] = [...aiEffects, ...localEffects];

export function getEffectById(id: string): VisualEffect | undefined {
  return effects.find((effect) => effect.id === id);
}

export { type VisualEffect, isAiEffect, isLocalEffect } from "./types";
