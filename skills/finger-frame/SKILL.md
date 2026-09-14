---
name: finger-frame
description: Finger-frame video effect — upload a two-hand gesture clip, AI-restylize with Gemini, composite animated content inside the tracked hand window. Use when the user wants finger-frame / hand-window masking video effects locally.
---

# Finger Frame

Video filter integrated from [finger-frame-effect-ai](https://github.com/sophiamyang/finger-frame-effect-ai).

## Web UI (local)

```bash
npm run dev
```

Open http://localhost:5000 → filter picker → **Finger Frame**.

1. Upload a short finger-frame dance clip (<15MB, 720p recommended)
2. Optional: enter Gemini API key ([Google AI Studio](https://aistudio.google.com/apikey))
3. **Generate AI video** (Gemini Omni Flash restyle) or **Try placeholder** (hue shift, no key)
4. **Preview** then **Export**

Tracking runs with MediaPipe in the browser; keys stay local.

## CLI (batch / frame-accurate H.264)

See [scripts/finger-frame/README.md](../../scripts/finger-frame/README.md).

## Credits

MIT — sophiamyang/finger-frame-effect-ai
