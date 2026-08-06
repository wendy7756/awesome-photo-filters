---
name: local-photo-filters
description: Apply photo filters such as VHS, film grain, sketch, glitch, neon, watercolor, and 29 other local Canvas-style effects to uploaded images. Use when the user asks for a photo filter, visual effect, retro look, art filter, or names a filter ID from awesome-photo-filters (grayscale, sepia, vhs, sketch, etc.).
---

# Local Photo Filters

Apply one of **35 local photo filters** to an uploaded image using Codex built-in image generation/editing. No external API key is required.

## Image generation (Codex)

- Use Codex built-in **image generation / editing** (`image_gen`) in **edit** mode when the user supplies a photo.
- Read [references/filters-catalog.md](references/filters-catalog.md) to resolve the filter name or ID.
- Treat **default intensity** as effect strength (0–100). If the user omits intensity, use the catalog default.
- Preserve the subject, composition, and identity of the source photo unless the filter intentionally transforms color globally (e.g. grayscale, invert, thermal).
- Return the edited image only unless the user asks for explanation.

## Workflow

1. Confirm which filter the user wants. Match friendly names (`VHS`, `film grain`) to catalog **IDs** (`vhs`, `film-grain`).
2. Look up the filter description and default intensity in [references/filters-catalog.md](references/filters-catalog.md).
3. Edit the uploaded image with a concise prompt that applies the named effect at the requested strength.
4. If the user is unsure, suggest 2–3 filters from the catalog that fit their description.

## Prompt guidance

Build the edit prompt from the catalog entry. Examples:

- **vhs** at 55: "Apply a VHS tape look with subtle chroma bleed, analog noise, and soft blur. Strength 55/100. Keep the original scene and subjects."
- **sketch** at 70: "Convert to a pencil sketch with clear line work. Strength 70/100. Preserve recognizable subjects."
- **grayscale** at 100: "Convert to classic black and white. Full strength."

## When to use a different skill

- **Abstract Editorial** (photo + abstract panel + title): use the `photo-abstract-editorial` skill instead.
- **Pixel-identical Canvas output** or live intensity slider: use the [web playground](https://github.com/wendy7756/awesome-photo-filters#quick-start-web-playground).

## Source

Part of [awesome-photo-filters](https://github.com/wendy7756/awesome-photo-filters).
