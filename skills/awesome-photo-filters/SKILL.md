---
name: awesome-photo-filters
description: Browse and apply photo filters from the awesome-photo-filters collection — 35 local effects (VHS, film grain, sketch, glitch, neon, etc.) and AI editorial workflows (Abstract Editorial). Use when the user asks for photo filters, visual effects, image editing styles, or mentions awesome-photo-filters.
---

# Awesome Photo Filters

Entry point for the [awesome-photo-filters](https://github.com/wendy7756/awesome-photo-filters) collection: **36 filters** total.

## Choose a skill

| User intent | Skill | API key |
| --- | --- | --- |
| Retro / art / glitch / color filters (`vhs`, `sketch`, `neon`, …) | **local-photo-filters** | Not required |
| Abstract editorial (photo + abstract panel + English title) | **photo-abstract-editorial** | Not required |
| Live preview, intensity slider, OpenRouter model choice | Web playground in this repo | OpenRouter key for AI only |

## Quick routing

1. If the user names **Abstract Editorial** or wants a photo-plus-abstraction editorial layout → follow **photo-abstract-editorial** (read its `SKILL.md` and reference prompts).
2. If the user names any other filter or a general photo effect → follow **local-photo-filters** and read [../local-photo-filters/references/filters-catalog.md](../local-photo-filters/references/filters-catalog.md).
3. If the user wants the exact web UI experience → suggest `npm install && npm run dev` from the repo.

## Bundled skills in this repository

```
skills/
├── awesome-photo-filters/     # This file — router
├── local-photo-filters/       # 35 local filters
└── photo-abstract-editorial/  # AI editorial workflow
```

## Install (Codex)

Install all skills from GitHub:

```bash
"$CODEX_HOME/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo wendy7756/awesome-photo-filters \
  --path skills/awesome-photo-filters skills/local-photo-filters skills/photo-abstract-editorial
```

Or run the helper script from a cloned repo:

```bash
./scripts/install-codex-skills.sh
```

Skills are installed to `$CODEX_HOME/skills/` (default `~/.codex/skills/`). They are available on the next Codex turn.

## Filter catalog

- Local filters (35): [../local-photo-filters/references/filters-catalog.md](../local-photo-filters/references/filters-catalog.md)
- AI filter (1): Abstract Editorial — see **photo-abstract-editorial**

## Web playground

For deterministic Canvas filters and OpenRouter-powered AI generation with side-by-side preview:

```bash
git clone https://github.com/wendy7756/awesome-photo-filters.git
cd awesome-photo-filters
npm install
npm run dev
```

Open http://localhost:5000.
