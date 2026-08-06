# Filter Catalog

Reference for the 35 local Canvas filters in [awesome-photo-filters](https://github.com/wendy7756/awesome-photo-filters). Use filter **ID** when the user names an effect. **Default intensity** is a 0–100 strength guide (100 = full effect).

## Basics

| ID | Name | Default | Description |
| --- | --- | ---: | --- |
| `grayscale` | Grayscale | 100 | Classic black and white |
| `sepia` | Sepia | 100 | Warm vintage film tone |
| `duotone` | Duotone | 100 | Two-color stylized look |
| `vignette` | Vignette | 55 | Darkened edges for focus |
| `blur` | Blur | 35 | Soft, gentle blur |
| `pixelate` | Pixelate | 45 | Retro pixel mosaic |
| `invert` | Invert | 100 | Negative color inversion |

## Retro & Film

| ID | Name | Default | Description |
| --- | --- | ---: | --- |
| `motion-blur` | Motion Blur | 45 | Directional movement blur |
| `frosted-glass` | Frosted Glass | 45 | Blurred glass with grain |
| `film-grain` | Film Grain | 40 | Analog film grain texture |
| `halftone` | Halftone | 60 | Newspaper dot pattern |
| `posterize` | Posterize | 65 | Flat color poster look |
| `cross-process` | Cross Process | 65 | Cross-processed film tones |
| `bleach-bypass` | Bleach Bypass | 65 | High-contrast desaturated film |
| `old-tv` | Old TV | 55 | Scanlines and slight warp |
| `vhs` | VHS | 55 | Chroma bleed, noise, and soft blur |

## Art & Color

| ID | Name | Default | Description |
| --- | --- | ---: | --- |
| `sketch` | Sketch | 70 | Pencil line drawing |
| `emboss` | Emboss | 65 | Raised relief shading |
| `oil-paint` | Oil Paint | 50 | Simplified oil brush strokes |
| `watercolor` | Watercolor | 55 | Soft bleed with dark edges |
| `cross-hatch` | Cross Hatch | 65 | Cross-hatched pencil shading |
| `thermal` | Thermal | 75 | Heat-map false color |
| `night-vision` | Night Vision | 70 | Green night-vision glow |
| `color-splash` | Color Splash | 70 | Keep dominant hue, gray the rest |
| `neon` | Neon | 55 | Saturated glow with deep shadows |
| `sunset` | Sunset | 50 | Warm golden-hour wash |

## Distortion & Light

| ID | Name | Default | Description |
| --- | --- | ---: | --- |
| `glitch` | Glitch | 50 | RGB shift and slice offsets |
| `chromatic-aberration` | Chromatic Aberration | 35 | Lens color fringing |
| `swirl` | Swirl | 50 | Swirl distortion from center |
| `fisheye` | Fisheye | 35 | Bulging lens distortion |
| `kaleidoscope` | Kaleidoscope | 65 | Mirrored radial symmetry |
| `mirror` | Mirror | 100 | Horizontal mirror repeat |
| `dream-glow` | Dream Glow | 50 | Soft luminous overlay |
| `lens-flare` | Lens Flare | 35 | Procedural light bloom |
| `light-leak` | Light Leak | 50 | Warm corner light leak |

## Implementation source

Each filter is implemented in TypeScript under [`src/effects/`](https://github.com/wendy7756/awesome-photo-filters/tree/main/src/effects). For pixel-identical output, run the [web playground](https://github.com/wendy7756/awesome-photo-filters#quick-start-web-playground) locally.
