# Finger Frame CLI

Python batch pipeline from [finger-frame-effect-ai](https://github.com/sophiamyang/finger-frame-effect-ai).

```bash
python3 -m venv .venv
.venv/bin/pip install -r scripts/finger-frame/requirements.txt

export GEMINI_API_KEY=...   # https://aistudio.google.com/apikey
.venv/bin/python scripts/finger-frame/stylize.py input.mp4 -o stylized.mp4
.venv/bin/python scripts/finger-frame/composite.py input.mp4 stylized.mp4 -o final.mp4
```

Requires `ffmpeg` on PATH for H.264 output and audio muxing.

For the browser UI, run `npm run dev` and choose **Finger Frame** in the filter picker.
