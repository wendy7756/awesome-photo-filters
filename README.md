# Awesome Photo Filters

**Repository:** [github.com/wendy7756/awesome-photo-filters](https://github.com/wendy7756/awesome-photo-filters)

A collection of **36 photo filters** — 35 local Canvas effects and 1 AI editorial workflow — usable in **Codex** (no API key) or in the **web playground** (live preview + OpenRouter for AI).

## Install in Codex (recommended)

Install all skills with one command. Uses Codex built-in image generation — **no OpenRouter or API key required**.

```bash
"$CODEX_HOME/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo wendy7756/awesome-photo-filters \
  --path skills/awesome-photo-filters skills/local-photo-filters skills/photo-abstract-editorial
```

Or from a cloned repo:

```bash
./scripts/install-codex-skills.sh
```

Then start a Codex chat, upload a photo, and ask for example:

- *Apply the VHS filter to this photo*
- *Use photo-abstract-editorial on this image*
- *Make this look like a pencil sketch at 70 intensity*

Skills install to `$CODEX_HOME/skills/` (default `~/.codex/skills/`) and are available on the next turn.

### Bundled Codex skills

| Skill | Purpose |
| --- | --- |
| [awesome-photo-filters](skills/awesome-photo-filters/SKILL.md) | Router — picks the right workflow |
| [local-photo-filters](skills/local-photo-filters/SKILL.md) | 35 local filters (VHS, sketch, neon, …) |
| [photo-abstract-editorial](skills/photo-abstract-editorial/SKILL.md) | AI editorial (photo + abstract panel + title) |

---

## Quick Start (Web Playground)

Side-by-side before/after UI with searchable filter picker and intensity slider. AI filters use [OpenRouter](https://openrouter.ai/) (API key required).

```bash
git clone https://github.com/wendy7756/awesome-photo-filters.git
cd awesome-photo-filters
npm install
npm run dev
```

Open [http://localhost:5000](http://localhost:5000).

```bash
npm run build    # production build
npm run preview  # preview production build
```

### Web usage

1. **Upload** an image in the left panel.
2. **Choose a filter** from the searchable dropdown.
3. **Adjust Intensity** — local filters update live; AI filters apply on Generate.
4. For **AI filters**, open **Settings** (gear icon):
   - Add your [OpenRouter](https://openrouter.ai/) API key
   - Enter a trusted HTTPS base URL (e.g. `https://openrouter.ai/api/v1`)
   - Select an image-to-image model
5. Click **Generate** for AI effects, then **Download** the result.

---

## Filters

Each filter lists its **ID**, default intensity, description, and source links.

### AI Effects

| Filter | ID | Default Intensity | Description | Source |
| --- | --- | ---: | --- | --- |
| [Abstract Editorial](https://github.com/ZzzLc0405/photo-abstract-editorial) | `abstract-editorial` | — | Photo with abstract panel and English title. | Upstream: [photo-abstract-editorial](https://github.com/ZzzLc0405/photo-abstract-editorial) · Codex skill: [`SKILL.md`](skills/photo-abstract-editorial/SKILL.md) · Prompts: [panel](skills/photo-abstract-editorial/references/photo-abstract-editorial-panel-prompt.en.md) · [composite](skills/photo-abstract-editorial/references/photo-abstract-editorial-prompt.en.md) · Web: [`ai-effects.ts`](src/effects/ai-effects.ts) |

### Basics

| Filter | ID | Default | Description | Source |
| --- | --- | ---: | --- | --- |
| [Grayscale](src/effects/builtins.ts#L7) | `grayscale` | 100 | Classic black and white. | [`builtins.ts`](src/effects/builtins.ts#L7) |
| [Sepia](src/effects/builtins.ts#L30) | `sepia` | 100 | Warm vintage film tone. | [`builtins.ts`](src/effects/builtins.ts#L30) |
| [Duotone](src/effects/builtins.ts#L114) | `duotone` | 100 | Two-color stylized look. | [`builtins.ts`](src/effects/builtins.ts#L114) |
| [Vignette](src/effects/builtins.ts#L94) | `vignette` | 55 | Darkened edges for focus. | [`builtins.ts`](src/effects/builtins.ts#L94) |
| [Blur](src/effects/builtins.ts#L80) | `blur` | 35 | Soft, gentle blur. | [`builtins.ts`](src/effects/builtins.ts#L80) |
| [Pixelate](src/effects/builtins.ts#L142) | `pixelate` | 45 | Retro pixel mosaic. | [`builtins.ts`](src/effects/builtins.ts#L142) |
| [Invert](src/effects/builtins.ts#L58) | `invert` | 100 | Negative color inversion. | [`builtins.ts`](src/effects/builtins.ts#L58) |

### Retro & Film

| Filter | ID | Default | Description | Source |
| --- | --- | ---: | --- | --- |
| [Motion Blur](src/effects/filters-retro.ts#L14) | `motion-blur` | 45 | Directional movement blur. | [`filters-retro.ts`](src/effects/filters-retro.ts#L14) |
| [Frosted Glass](src/effects/filters-retro.ts#L34) | `frosted-glass` | 45 | Blurred glass with grain. | [`filters-retro.ts`](src/effects/filters-retro.ts#L34) |
| [Film Grain](src/effects/filters-retro.ts#L59) | `film-grain` | 40 | Analog film grain texture. | [`filters-retro.ts`](src/effects/filters-retro.ts#L59) |
| [Halftone](src/effects/filters-retro.ts#L81) | `halftone` | 60 | Newspaper dot pattern. | [`filters-retro.ts`](src/effects/filters-retro.ts#L81) |
| [Posterize](src/effects/filters-retro.ts#L118) | `posterize` | 65 | Flat color poster look. | [`filters-retro.ts`](src/effects/filters-retro.ts#L118) |
| [Cross Process](src/effects/filters-retro.ts#L140) | `cross-process` | 65 | Cross-processed film tones. | [`filters-retro.ts`](src/effects/filters-retro.ts#L140) |
| [Bleach Bypass](src/effects/filters-retro.ts#L164) | `bleach-bypass` | 65 | High-contrast desaturated film. | [`filters-retro.ts`](src/effects/filters-retro.ts#L164) |
| [Old TV](src/effects/filters-retro.ts#L192) | `old-tv` | 55 | Scanlines and slight warp. | [`filters-retro.ts`](src/effects/filters-retro.ts#L192) |
| [VHS](src/effects/filters-retro.ts#L226) | `vhs` | 55 | Chroma bleed, noise, and soft blur. | [`filters-retro.ts`](src/effects/filters-retro.ts#L226) |

### Art & Color

| Filter | ID | Default | Description | Source |
| --- | --- | ---: | --- | --- |
| [Sketch](src/effects/filters-art-color.ts#L44) | `sketch` | 70 | Pencil line drawing. | [`filters-art-color.ts`](src/effects/filters-art-color.ts#L44) |
| [Emboss](src/effects/filters-art-color.ts#L74) | `emboss` | 65 | Raised relief shading. | [`filters-art-color.ts`](src/effects/filters-art-color.ts#L74) |
| [Oil Paint](src/effects/filters-art-color.ts#L114) | `oil-paint` | 50 | Simplified oil brush strokes. | [`filters-art-color.ts`](src/effects/filters-art-color.ts#L114) |
| [Watercolor](src/effects/filters-art-color.ts#L146) | `watercolor` | 55 | Soft bleed with dark edges. | [`filters-art-color.ts`](src/effects/filters-art-color.ts#L146) |
| [Cross Hatch](src/effects/filters-art-color.ts#L172) | `cross-hatch` | 65 | Cross-hatched pencil shading. | [`filters-art-color.ts`](src/effects/filters-art-color.ts#L172) |
| [Thermal](src/effects/filters-art-color.ts#L210) | `thermal` | 75 | Heat-map false color. | [`filters-art-color.ts`](src/effects/filters-art-color.ts#L210) |
| [Night Vision](src/effects/filters-art-color.ts#L249) | `night-vision` | 70 | Green night-vision glow. | [`filters-art-color.ts`](src/effects/filters-art-color.ts#L249) |
| [Color Splash](src/effects/filters-art-color.ts#L269) | `color-splash` | 70 | Keep dominant hue, gray the rest. | [`filters-art-color.ts`](src/effects/filters-art-color.ts#L269) |
| [Neon](src/effects/filters-art-color.ts#L307) | `neon` | 55 | Saturated glow with deep shadows. | [`filters-art-color.ts`](src/effects/filters-art-color.ts#L307) |
| [Sunset](src/effects/filters-art-color.ts#L350) | `sunset` | 50 | Warm golden-hour wash. | [`filters-art-color.ts`](src/effects/filters-art-color.ts#L350) |

### Distortion & Light

| Filter | ID | Default | Description | Source |
| --- | --- | ---: | --- | --- |
| [Glitch](src/effects/filters-distort-light.ts#L11) | `glitch` | 50 | RGB shift and slice offsets. | [`filters-distort-light.ts`](src/effects/filters-distort-light.ts#L11) |
| [Chromatic Aberration](src/effects/filters-distort-light.ts#L42) | `chromatic-aberration` | 35 | Lens color fringing. | [`filters-distort-light.ts`](src/effects/filters-distort-light.ts#L42) |
| [Swirl](src/effects/filters-distort-light.ts#L68) | `swirl` | 50 | Swirl distortion from center. | [`filters-distort-light.ts`](src/effects/filters-distort-light.ts#L68) |
| [Fisheye](src/effects/filters-distort-light.ts#L89) | `fisheye` | 35 | Bulging lens distortion. | [`filters-distort-light.ts`](src/effects/filters-distort-light.ts#L89) |
| [Kaleidoscope](src/effects/filters-distort-light.ts#L110) | `kaleidoscope` | 65 | Mirrored radial symmetry. | [`filters-distort-light.ts`](src/effects/filters-distort-light.ts#L110) |
| [Mirror](src/effects/filters-distort-light.ts#L135) | `mirror` | 100 | Horizontal mirror repeat. | [`filters-distort-light.ts`](src/effects/filters-distort-light.ts#L135) |
| [Dream Glow](src/effects/filters-distort-light.ts#L153) | `dream-glow` | 50 | Soft luminous overlay. | [`filters-distort-light.ts`](src/effects/filters-distort-light.ts#L153) |
| [Lens Flare](src/effects/filters-distort-light.ts#L173) | `lens-flare` | 35 | Procedural light bloom. | [`filters-distort-light.ts`](src/effects/filters-distort-light.ts#L173) |
| [Light Leak](src/effects/filters-distort-light.ts#L196) | `light-leak` | 50 | Warm corner light leak. | [`filters-distort-light.ts`](src/effects/filters-distort-light.ts#L196) |

---

## Project Structure

```
skills/                          # Codex-installable skills (source of truth for prompts)
├── awesome-photo-filters/       # Router skill
├── local-photo-filters/         # 35 local filters
└── photo-abstract-editorial/    # AI editorial + reference prompts
scripts/
└── install-codex-skills.sh      # One-command Codex install
src/
├── main.ts                      # Web UI
├── effects/                     # Canvas filter implementations
└── prompts/                     # Web app prompt imports from skills/
```

## Adding a Filter

1. Implement in `src/effects/` and register in [`src/effects/index.ts`](src/effects/index.ts).
2. Add the filter to [`skills/local-photo-filters/references/filters-catalog.md`](skills/local-photo-filters/references/filters-catalog.md).
3. Update this README filter table.

For AI/upstream effects, add a skill under `skills/` with `SKILL.md`, `agents/openai.yaml`, and reference prompts.

## Acknowledgements

- [Abstract Editorial](https://github.com/ZzzLc0405/photo-abstract-editorial) — upstream AI editorial workflow
- [OpenRouter](https://openrouter.ai/) — image API for the web playground AI filters

## Contributing

Contributions welcome — new filters, Codex skills, bug fixes, and docs. Keep filter metadata (`id`, `name`, `description`, `defaultIntensity`) in sync across `src/effects/` and `skills/local-photo-filters/references/filters-catalog.md`.
