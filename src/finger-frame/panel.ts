import { FingerFrameController } from "./controller";
import {
  getGeminiRemember,
  getStoredCustomStyle,
  getStoredGeminiKey,
  getStoredStyle,
  setGeminiRemember,
  setStoredCustomStyle,
  setStoredGeminiKey,
  setStoredStyle,
} from "./settings";

let controller: FingerFrameController | null = null;
let mountAbort: AbortController | null = null;

function syncFingerFrameUI(): void {
  if (!controller) return;
  const s = controller.state;

  const statusEl = document.querySelector<HTMLParagraphElement>("#ff-status");
  if (statusEl) {
    statusEl.textContent = s.status;
    statusEl.classList.toggle("is-working", s.isWorking);
  }

  const hasVideo = Boolean(s.videoFile);
  const setDisabled = (id: string, enabled: boolean) => {
    const el = document.querySelector<HTMLButtonElement>(id);
    if (el) el.disabled = !enabled;
  };

  setDisabled("#ff-generate", hasVideo && !s.isWorking);
  setDisabled("#ff-placeholder", hasVideo && !s.isWorking);
  setDisabled("#ff-preview", s.canPreview && !s.isWorking);
  setDisabled("#ff-export", s.canPreview && !s.isWorking);

  const meta = document.querySelector(".finger-frame-grid .panel-meta");
  if (meta && s.videoName) meta.textContent = s.videoName;
}

export function destroyFingerFramePanel(): void {
  mountAbort?.abort();
  mountAbort = null;
  controller = null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderFingerFrameWorkspace(): string {
  const s = controller?.state;
  const hasVideo = Boolean(s?.videoFile);
  const status = s?.status ?? "Upload a finger-frame dance clip to begin.";
  const working = s?.isWorking ?? false;

  return `
    <section class="finger-frame-toolbar" aria-label="Finger frame controls">
      <div class="finger-frame-settings card">
        <p class="finger-frame-step"><span class="step-num">1</span> Key &amp; style</p>
        <p class="finger-frame-hint">
          AI restyle uses <a href="https://ai.google.dev/gemini-api/docs/omni" target="_blank" rel="noreferrer">Gemini Omni Flash</a>
          in your browser. No key? Use placeholder first.
        </p>
        <label class="field">
          <span>Gemini API key</span>
          <input id="ff-gemini-key" type="password" placeholder="AIza…" value="${escapeHtml(s?.geminiKey ?? "")}" autocomplete="off" />
        </label>
        <label class="remember-row">
          <input id="ff-remember-key" type="checkbox" ${s?.rememberKey ? "checked" : ""} />
          Remember on this device
        </label>
        <div class="finger-frame-style-row">
          <label class="field">
            <span>Style</span>
            <select id="ff-style">
              <option value="movie3d" ${s?.styleKey === "movie3d" ? "selected" : ""}>3D animated movie</option>
              <option value="anime" ${s?.styleKey === "anime" ? "selected" : ""}>Anime</option>
              <option value="clay" ${s?.styleKey === "clay" ? "selected" : ""}>Claymation</option>
              <option value="watercolor" ${s?.styleKey === "watercolor" ? "selected" : ""}>Watercolor</option>
              <option value="custom" ${s?.styleKey === "custom" ? "selected" : ""}>Custom prompt…</option>
            </select>
          </label>
          <label class="field ${s?.styleKey === "custom" ? "" : "hidden"}" id="ff-custom-wrap">
            <span>Custom style prompt</span>
            <textarea id="ff-custom-style" rows="3" placeholder="Describe the look…">${escapeHtml(s?.customStyle ?? "")}</textarea>
          </label>
        </div>
      </div>
      <div class="finger-frame-actions">
        <button class="btn btn-accent" id="ff-generate" type="button" ${hasVideo && !working ? "" : "disabled"}>Generate AI video</button>
        <button class="btn" id="ff-placeholder" type="button" ${hasVideo && !working ? "" : "disabled"}>Try placeholder</button>
        <button class="btn" id="ff-preview" type="button" ${s?.canPreview && !working ? "" : "disabled"}>Preview</button>
        <button class="btn" id="ff-export" type="button" ${s?.canPreview && !working ? "" : "disabled"}>Export</button>
      </div>
      <p class="finger-frame-status ${working ? "is-working" : ""}" id="ff-status">${escapeHtml(status)}</p>
    </section>

    <main class="workspace">
      <div class="panel-grid finger-frame-grid">
        <article class="panel">
          <header class="panel-header">
            <span class="panel-label">Source video</span>
            ${hasVideo ? `<span class="panel-meta">${escapeHtml(s!.videoName)}</span>` : `<span class="panel-hint">Upload a clip with the two-hand gesture</span>`}
          </header>
          <div class="panel-frame finger-frame-drop ${hasVideo ? "has-video" : ""}" id="ff-drop">
            <label class="upload-zone" for="ff-file-input">
              <span class="upload-title">${hasVideo ? "Replace video" : "Upload a video"}</span>
              <span class="upload-hint">MP4 / MOV / WebM · under 15MB · a few seconds of 720p works best</span>
            </label>
            <input type="file" id="ff-file-input" accept="video/*" hidden />
          </div>
        </article>

        <article class="panel">
          <header class="panel-header">
            <span class="panel-label">Result</span>
            <span class="panel-hint">Tracked finger-frame preview</span>
          </header>
          <div class="panel-frame finger-frame-result">
            <canvas id="ff-canvas" class="finger-frame-canvas"></canvas>
            ${
              !hasVideo
                ? `<div class="result-placeholder">Your composited video preview appears here</div>`
                : ""
            }
          </div>
        </article>
      </div>
    </main>

    <footer class="footer finger-frame-footer">
      Based on
      <a href="https://github.com/sophiamyang/finger-frame-effect-ai" target="_blank" rel="noreferrer">finger-frame-effect-ai</a>
      · MediaPipe hand tracking · runs locally in your browser
    </footer>
  `;
}

export function mountFingerFramePanel(): void {
  const canvas = document.querySelector<HTMLCanvasElement>("#ff-canvas");
  if (!canvas) return;

  mountAbort?.abort();
  mountAbort = new AbortController();
  const { signal } = mountAbort;

  if (!controller) {
    controller = new FingerFrameController(canvas);
    controller.state.geminiKey = getStoredGeminiKey();
    controller.state.rememberKey = getGeminiRemember();
    controller.state.styleKey = getStoredStyle();
    controller.state.customStyle = getStoredCustomStyle();
  } else {
    controller.onChange = syncFingerFrameUI;
  }

  controller.onChange = syncFingerFrameUI;

  const fileInput = document.querySelector<HTMLInputElement>("#ff-file-input");
  const drop = document.querySelector<HTMLDivElement>("#ff-drop");
  const keyInput = document.querySelector<HTMLInputElement>("#ff-gemini-key");
  const remember = document.querySelector<HTMLInputElement>("#ff-remember-key");
  const styleSelect = document.querySelector<HTMLSelectElement>("#ff-style");
  const customWrap = document.querySelector<HTMLDivElement>("#ff-custom-wrap");
  const customStyle = document.querySelector<HTMLTextAreaElement>("#ff-custom-style");

  const loadFile = (file: File | undefined) => {
    if (!file?.type.startsWith("video/") || !controller) return;
    void controller.loadVideo(file);
  };

  fileInput?.addEventListener(
    "change",
    () => {
      loadFile(fileInput.files?.[0]);
      fileInput.value = "";
    },
    { signal }
  );

  drop?.addEventListener(
    "dragover",
    (event) => {
      event.preventDefault();
      drop.classList.add("is-dragging");
    },
    { signal }
  );
  drop?.addEventListener("dragleave", () => drop.classList.remove("is-dragging"), { signal });
  drop?.addEventListener(
    "drop",
    (event) => {
      event.preventDefault();
      drop.classList.remove("is-dragging");
      loadFile(event.dataTransfer?.files[0]);
    },
    { signal }
  );

  keyInput?.addEventListener(
    "input",
    () => {
      if (controller) controller.state.geminiKey = keyInput.value;
    },
    { signal }
  );
  keyInput?.addEventListener(
    "change",
    () => {
      if (!controller) return;
      const rememberChecked = remember?.checked ?? false;
      setStoredGeminiKey(keyInput.value, rememberChecked);
      setGeminiRemember(rememberChecked);
    },
    { signal }
  );

  remember?.addEventListener(
    "change",
    () => {
      if (!controller) return;
      controller.state.rememberKey = remember.checked;
      setGeminiRemember(remember.checked);
      setStoredGeminiKey(controller.state.geminiKey, remember.checked);
    },
    { signal }
  );

  styleSelect?.addEventListener(
    "change",
    () => {
      if (!controller) return;
      controller.state.styleKey = styleSelect.value;
      setStoredStyle(styleSelect.value);
      customWrap?.classList.toggle("hidden", styleSelect.value !== "custom");
    },
    { signal }
  );

  customStyle?.addEventListener(
    "input",
    () => {
      if (!controller) return;
      controller.state.customStyle = customStyle.value;
      setStoredCustomStyle(customStyle.value);
    },
    { signal }
  );

  document.querySelector("#ff-generate")?.addEventListener(
    "click",
    () => {
      if (!controller) return;
      if (keyInput) {
        controller.state.geminiKey = keyInput.value;
        setStoredGeminiKey(keyInput.value, remember?.checked ?? false);
      }
      void controller.generateAi();
    },
    { signal }
  );

  document.querySelector("#ff-placeholder")?.addEventListener(
    "click",
    () => controller?.enablePlaceholder(),
    { signal }
  );

  document.querySelector("#ff-preview")?.addEventListener(
    "click",
    () => void controller?.playPreview(),
    { signal }
  );

  document.querySelector("#ff-export")?.addEventListener(
    "click",
    () => void controller?.exportVideo(),
    { signal }
  );

  syncFingerFrameUI();
}
