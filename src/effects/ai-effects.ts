import {
  PHOTO_ABSTRACT_EDITORIAL_COMPOSITE_PROMPT,
  PHOTO_ABSTRACT_EDITORIAL_PANEL_PROMPT,
} from "../prompts/photo-abstract-editorial";
import type { AiEffect } from "./types";

export const ABSTRACT_EDITORIAL_ID = "abstract-editorial";

export const abstractEditorialEffect: AiEffect = {
  kind: "ai",
  id: ABSTRACT_EDITORIAL_ID,
  name: "Abstract Editorial",
  description: "Photo with abstract panel and English title.",
  sourceUrl: "https://github.com/ZzzLc0405/photo-abstract-editorial",
  prompt: PHOTO_ABSTRACT_EDITORIAL_PANEL_PROMPT,
  compositePrompt: PHOTO_ABSTRACT_EDITORIAL_COMPOSITE_PROMPT,
  requiresImageInput: true,
};

export const aiEffects: AiEffect[] = [abstractEditorialEffect];
