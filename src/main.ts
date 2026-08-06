import {
  ABSTRACT_EDITORIAL_ID,
  getExpectedCompositeAspectRatio,
} from "./abstract-editorial";
import { effects, getEffectById, isAiEffect, isLocalEffect } from "./effects";
import {
  closestAspectRatio,
  closestAspectRatioFromValue,
  generateImage,
  listImageModels,
  type ImageModel,
} from "./openrouter";
import {
  DEFAULT_OPENROUTER_BASE_URL,
  getStoredApiKey,
  getStoredBaseUrl,
  getStoredModel,
  isTrustedBaseUrl,
  resolveBaseUrl,
  setStoredApiKey,
  setStoredBaseUrl,
  setStoredModel,
} from "./settings";
import "./style.css";

interface AppState {
  sourceImage: HTMLImageElement | null;
  sourceDataUrl: string | null;
  aspectRatio: number;
  resultAspectRatio: number;
  selectedEffectId: string;
  intensity: number;
  isDragging: boolean;
  apiKey: string;
  baseUrl: string;
  selectedModelId: string;
  availableModels: ImageModel[];
  modelsLoading: boolean;
  modelsError: string | null;
  isSettingsPinned: boolean;
  isGenerating: boolean;
  generationPhase: "panel" | "artwork" | null;
  generationError: string | null;
  aiPanelDataUrl: string | null;
  aiCompositeDataUrl: string | null;
  panelWidth: number;
  panelHeight: number;
  compositeAspectRatio: number;
  compositeWidth: number;
  compositeHeight: number;
  isFilterPickerOpen: boolean;
  filterSearchQuery: string;
}

const state: AppState = {
  sourceImage: null,
  sourceDataUrl: null,
  aspectRatio: 4 / 3,
  resultAspectRatio: 4 / 3,
  selectedEffectId: effects[0].id,
  intensity: effects[0].defaultIntensity ?? 100,
  isDragging: false,
  apiKey: getStoredApiKey(),
  baseUrl: getStoredBaseUrl(),
  selectedModelId: getStoredModel(),
  availableModels: [],
  modelsLoading: false,
  modelsError: null,
  isSettingsPinned: false,
  isGenerating: false,
  generationPhase: null,
  generationError: null,
  aiPanelDataUrl: null,
  aiCompositeDataUrl: null,
  panelWidth: 0,
  panelHeight: 0,
  compositeAspectRatio: 4 / 3,
  compositeWidth: 0,
  compositeHeight: 0,
  isFilterPickerOpen: false,
  filterSearchQuery: "",
};

let settingsOutsideClickBound = false;

const app = document.querySelector<HTMLDivElement>("#app")!;
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

function formatAspectRatio(ratio: number): string | null {
  const common = [
    [1, 1],
    [4, 3],
    [3, 4],
    [16, 9],
    [9, 16],
    [3, 2],
    [2, 3],
    [21, 9],
  ] as const;

  for (const [w, h] of common) {
    if (Math.abs(ratio - w / h) < 0.02) return `${w}:${h}`;
  }

  return null;
}

function formatPanelMeta(width: number, height: number, ratio: number): string {
  return formatAspectRatio(ratio) ?? `${width} × ${height} px`;
}

function isAbstractEditorialSelected(): boolean {
  return state.selectedEffectId === ABSTRACT_EDITORIAL_ID;
}

function clearAiResults(): void {
  state.aiPanelDataUrl = null;
  state.aiCompositeDataUrl = null;
  state.panelWidth = 0;
  state.panelHeight = 0;
  state.compositeAspectRatio = state.aspectRatio;
  state.compositeWidth = 0;
  state.compositeHeight = 0;
}

function generationStatusText(): string {
  const model = escapeHtml(selectedModelLabel());
  if (state.generationPhase === "panel") {
    return `Generating abstract panel (1/2) with ${model}...`;
  }
  if (state.generationPhase === "artwork") {
    return `Generating artwork (2/2) with ${model}...`;
  }
  return `Generating with ${model}...`;
}

function selectedEffect() {
  return getEffectById(state.selectedEffectId)!;
}

function filteredEffects() {
  const query = state.filterSearchQuery.trim().toLowerCase();
  if (!query) return effects;
  return effects.filter(
    (item) =>
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query)
  );
}

function selectEffect(effectId: string): void {
  if (effectId === state.selectedEffectId) {
    state.isFilterPickerOpen = false;
    state.filterSearchQuery = "";
    return;
  }
  state.selectedEffectId = effectId;
  const effect = selectedEffect();
  state.intensity = effect.defaultIntensity ?? 100;
  state.generationError = null;
  clearAiResults();
  state.resultAspectRatio = state.aspectRatio;
  state.isFilterPickerOpen = false;
  state.filterSearchQuery = "";
  render();
}

function closeFilterPicker(): void {
  if (!state.isFilterPickerOpen) return;
  state.isFilterPickerOpen = false;
  state.filterSearchQuery = "";
  render();
}

function selectedModelLabel(): string {
  const model = state.availableModels.find((item) => item.id === state.selectedModelId);
  if (model) return model.name;
  if (state.selectedModelId) return state.selectedModelId;
  return "Not selected";
}

function modelStatusText(): string {
  if (state.modelsLoading) return "Loading compatible models...";
  if (state.availableModels.length > 0) {
    return `${state.availableModels.length} image-to-image models`;
  }
  if (!state.baseUrl.trim()) return "Enter a Base URL and API key";
  if (state.apiKey) return "Enter a valid API key";
  return "Enter your API key to load models";
}

function modelOptionsHtml(): string {
  if (state.availableModels.length === 0) {
    return `<option value="">No compatible models yet</option>`;
  }
  return state.availableModels
    .map(
      (model) =>
        `<option value="${model.id}" ${model.id === state.selectedModelId ? "selected" : ""}>${escapeHtml(model.name)}</option>`
    )
    .join("");
}

function renderSettingsPopover(): string {
  return `
    <div class="model-settings ${state.isSettingsPinned ? "is-pinned" : ""}" id="model-settings">
      <button class="settings-trigger" id="settings-trigger" type="button" aria-label="Model settings">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
      <div class="settings-popover" id="settings-popover">
        <div class="settings-popover-header">
          <p class="settings-popover-title">Model settings</p>
          <button class="btn btn-accent btn-sm settings-save-btn" id="settings-save" type="button">Save</button>
        </div>
        <div class="settings-popover-body">
        <label class="field">
          <span>Base URL</span>
          <input
            id="base-url-input"
            type="url"
            placeholder="e.g. ${DEFAULT_OPENROUTER_BASE_URL}"
            value="${escapeHtml(state.baseUrl)}"
            autocomplete="off"
          />
        </label>
        <label class="field">
          <span>API key</span>
          <input
            id="api-key-input"
            type="password"
            placeholder="e.g. sk-or-..."
            value="${escapeHtml(state.apiKey)}"
            autocomplete="off"
          />
        </label>
        <p class="field-status settings-status">${escapeHtml(modelStatusText())}</p>
        ${state.modelsError ? `<p class="form-error settings-error">${escapeHtml(state.modelsError)}</p>` : ""}
        <label class="field">
          <span>Model</span>
          <select id="model-select" ${state.availableModels.length === 0 ? "disabled" : ""}>
            ${modelOptionsHtml()}
          </select>
        </label>
        </div>
      </div>
    </div>
  `;
}

function syncSettingsUI(): void {
  const root = document.querySelector("#model-settings");
  if (!root) {
    render();
    return;
  }

  const statusEl = root.querySelector(".settings-status");
  const errorEl = root.querySelector(".settings-error");
  const selectEl = root.querySelector<HTMLSelectElement>("#model-select");

  statusEl && (statusEl.textContent = modelStatusText());

  if (errorEl) {
    if (state.modelsError) {
      errorEl.textContent = state.modelsError;
      (errorEl as HTMLElement).hidden = false;
    } else {
      (errorEl as HTMLElement).hidden = true;
    }
  } else if (state.modelsError) {
    const hint = root.querySelector(".field-status");
    hint?.insertAdjacentHTML(
      "afterend",
      `<p class="form-error settings-error">${escapeHtml(state.modelsError)}</p>`
    );
  }

  if (selectEl) {
    selectEl.disabled = state.availableModels.length === 0;
    selectEl.innerHTML = modelOptionsHtml();
    selectEl.value = state.selectedModelId;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function render(): void {
  const effect = selectedEffect();
  const hasImage = state.sourceImage !== null;
  const isAi = isAiEffect(effect);
  const isAbstractEditorial = isAbstractEditorialSelected();
  const showIntensity = isLocalEffect(effect);
  const hasAiPanel = isAbstractEditorial && Boolean(state.aiPanelDataUrl);
  const hasAiComposite = isAbstractEditorial && Boolean(state.aiCompositeDataUrl);
  const hasResultPreview = isAbstractEditorial
    ? hasAiPanel
    : isAi
      ? Boolean(state.aiCompositeDataUrl)
      : hasImage;

  app.innerHTML = `
    <div class="layout">
      <header class="header">
        <div class="brand">
          <h1>Photo Filters</h1>
          <p>Upload an image, choose a filter, and see the result side by side.</p>
        </div>
        <div class="header-actions">
          ${isAi ? renderSettingsPopover() : ""}
          <a class="github-link" href="https://github.com/wendy7756/awesome-photo-filters" target="_blank" rel="noreferrer" aria-label="View on GitHub">
            <svg class="github-link-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.021C22 6.484 17.522 2 12 2z"/>
            </svg>
          </a>
        </div>
      </header>

      <section class="toolbar" aria-label="Effect controls">
        <div class="toolbar-main">
          <div class="toolbar-filter-row">
            <div class="effect-picker">
              <label for="effect-search">Filter</label>
              <div class="effect-combobox ${state.isFilterPickerOpen ? "is-open" : ""}" id="effect-combobox">
                ${
                  state.isFilterPickerOpen
                    ? `
                  <input
                    id="effect-search"
                    class="effect-combobox-input"
                    type="search"
                    role="combobox"
                    aria-expanded="true"
                    aria-controls="effect-combobox-list"
                    autocomplete="off"
                    placeholder="Search filters..."
                    value="${escapeHtml(state.filterSearchQuery)}"
                  />
                `
                    : `
                  <button class="effect-combobox-trigger" id="effect-combobox-trigger" type="button" aria-haspopup="listbox" aria-expanded="false">
                    ${escapeHtml(effect.name)}
                  </button>
                `
                }
                ${
                  state.isFilterPickerOpen
                    ? `
                  <ul class="effect-combobox-list" id="effect-combobox-list" role="listbox">
                    ${
                      filteredEffects().length > 0
                        ? filteredEffects()
                            .map(
                              (item) => `
                          <li>
                            <button
                              class="effect-combobox-option ${item.id === state.selectedEffectId ? "is-selected" : ""}"
                              type="button"
                              role="option"
                              aria-selected="${item.id === state.selectedEffectId}"
                              data-effect-id="${item.id}"
                            >
                              <span class="effect-combobox-option-name">${escapeHtml(item.name)}</span>
                              <span class="effect-combobox-option-desc">${escapeHtml(item.description)}</span>
                            </button>
                          </li>
                        `
                            )
                            .join("")
                        : `<li class="effect-combobox-empty">No filters match "${escapeHtml(state.filterSearchQuery)}"</li>`
                    }
                  </ul>
                `
                    : ""
                }
              </div>
            </div>
            ${
              showIntensity
                ? `
              <div class="intensity-control">
                <label for="intensity">Intensity</label>
                <input
                  id="intensity"
                  type="range"
                  min="0"
                  max="100"
                  value="${state.intensity}"
                  ${hasImage ? "" : "disabled"}
                />
                <span class="intensity-value">${state.intensity}%</span>
              </div>
            `
                : ""
            }
          </div>
          <p class="effect-desc">${effect.description}</p>
          <div class="toolbar-actions">
            ${
              isAi
                ? `
              <button class="btn btn-accent btn-compact" id="generate-btn" type="button" ${hasImage && !state.isGenerating ? "" : "disabled"}>
                ${state.isGenerating ? "Generating..." : "Generate"}
              </button>
            `
                : ""
            }
            <button class="btn btn-accent btn-compact" id="download-btn" type="button" ${hasImage && !state.isGenerating ? "" : "disabled"}>
              Download
            </button>
          </div>
        </div>
      </section>

      ${state.generationError ? `<p class="banner-error">${escapeHtml(state.generationError)}</p>` : ""}

      <main class="workspace">
        <div class="panel-grid">
          <article class="panel">
            <header class="panel-header">
              <span class="panel-label">Original</span>
              ${
                hasImage
                  ? `<span class="panel-meta">${formatPanelMeta(
                      state.sourceImage!.naturalWidth,
                      state.sourceImage!.naturalHeight,
                      state.aspectRatio
                    )}</span>`
                  : ""
              }
            </header>
            <div
              class="panel-frame ${state.isDragging ? "is-dragging" : ""}"
              style="aspect-ratio: ${state.aspectRatio}"
              id="drop-zone"
            >
              ${
                hasImage
                  ? `<img src="${state.sourceImage!.src}" alt="Uploaded original" class="panel-image" />`
                  : `
                <label class="upload-zone" for="file-input">
                  <span class="upload-title">Upload an image</span>
                  <span class="upload-hint">Drag and drop, or click to browse</span>
                </label>
              `
              }
              <input type="file" id="file-input" accept="image/*" hidden />
            </div>
          </article>

          <article class="panel">
            <header class="panel-header">
              <span class="panel-label">Result</span>
              ${
                hasResultPreview && hasImage
                  ? `<span class="panel-meta">${formatPanelMeta(
                      isAbstractEditorial && state.panelWidth
                        ? state.panelWidth
                        : state.sourceImage!.naturalWidth,
                      isAbstractEditorial && state.panelHeight
                        ? state.panelHeight
                        : state.sourceImage!.naturalHeight,
                      state.resultAspectRatio
                    )}</span>`
                  : `<span class="panel-hint">Your result will appear here</span>`
              }
            </header>
            <div class="panel-frame" style="aspect-ratio: ${state.resultAspectRatio}" id="result-frame">
              ${
                state.isGenerating
                  ? `<div class="result-placeholder">${generationStatusText()}</div>`
                  : hasImage && hasResultPreview
                    ? `<img id="result-image" alt="Processed result" class="panel-image" src="${
                        isAbstractEditorial ? state.aiPanelDataUrl : state.aiCompositeDataUrl
                      }" />`
                    : `<div class="result-placeholder">${isAi ? "Click Generate to create your image" : "Preview updates automatically"}</div>`
              }
            </div>
          </article>
        </div>
        ${
          hasAiComposite
            ? `
          <article class="panel panel-composite">
            <header class="panel-header">
              <span class="panel-label">Artwork</span>
              <span class="panel-meta">${formatPanelMeta(
                state.compositeWidth,
                state.compositeHeight,
                state.compositeAspectRatio
              )}</span>
            </header>
            <div class="panel-frame" style="aspect-ratio: ${state.compositeAspectRatio}">
              <img id="artwork-image" src="${state.aiCompositeDataUrl}" alt="Generated editorial artwork" class="panel-image" />
            </div>
          </article>
        `
            : ""
        }
      </main>

      <footer class="footer">
        Open source · Stored locally in your browser · We do not collect any data
      </footer>
    </div>
  `;

  bindEvents();
  bindEffectPickerEvents();

  if (hasImage && isLocalEffect(effect)) {
    applyLocalEffect();
  }
}

function bindEvents(): void {
  const fileInput = document.querySelector<HTMLInputElement>("#file-input");
  const dropZone = document.querySelector<HTMLDivElement>("#drop-zone");
  const intensityInput = document.querySelector<HTMLInputElement>("#intensity");
  const downloadBtn = document.querySelector<HTMLButtonElement>("#download-btn");
  const generateBtn = document.querySelector<HTMLButtonElement>("#generate-btn");

  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) loadFile(file);
  });

  dropZone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    state.isDragging = true;
    dropZone.classList.add("is-dragging");
  });

  dropZone?.addEventListener("dragleave", () => {
    state.isDragging = false;
    dropZone.classList.remove("is-dragging");
  });

  dropZone?.addEventListener("drop", (event) => {
    event.preventDefault();
    state.isDragging = false;
    dropZone.classList.remove("is-dragging");
    const file = event.dataTransfer?.files[0];
    if (file?.type.startsWith("image/")) loadFile(file);
  });

  intensityInput?.addEventListener("input", () => {
    state.intensity = Number(intensityInput.value);
    document.querySelector(".intensity-value")!.textContent = `${state.intensity}%`;
    applyLocalEffect();
  });

  downloadBtn?.addEventListener("click", downloadResult);
  generateBtn?.addEventListener("click", () => {
    void runAiGeneration();
  });

  bindSettingsEvents();
}

let filterPickerOutsideClickBound = false;

function bindEffectPickerEvents(): void {
  const combobox = document.querySelector<HTMLDivElement>("#effect-combobox");
  const trigger = document.querySelector<HTMLButtonElement>("#effect-combobox-trigger");
  const searchInput = document.querySelector<HTMLInputElement>("#effect-search");
  const options = document.querySelectorAll<HTMLButtonElement>("[data-effect-id]");

  trigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    state.isFilterPickerOpen = true;
    state.filterSearchQuery = "";
    render();
  });

  combobox?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  searchInput?.addEventListener("input", () => {
    state.filterSearchQuery = searchInput.value;
    render();
  });

  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeFilterPicker();
    }
  });

  options.forEach((option) => {
    option.addEventListener("click", () => {
      selectEffect(option.dataset.effectId!);
    });
  });

  if (state.isFilterPickerOpen) {
    searchInput?.focus();
  }

  if (!filterPickerOutsideClickBound) {
    filterPickerOutsideClickBound = true;
    document.addEventListener("click", (event) => {
      if (!state.isFilterPickerOpen) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (combobox?.contains(target)) return;
      closeFilterPicker();
    });
  }
}

function bindSettingsEvents(): void {
  const settingsRoot = document.querySelector<HTMLDivElement>("#model-settings");
  const settingsTrigger = document.querySelector<HTMLButtonElement>("#settings-trigger");
  const settingsPopover = document.querySelector<HTMLDivElement>("#settings-popover");
  const baseUrlInput = document.querySelector<HTMLInputElement>("#base-url-input");
  const apiKeyInput = document.querySelector<HTMLInputElement>("#api-key-input");
  const modelSelect = document.querySelector<HTMLSelectElement>("#model-select");
  const saveBtn = document.querySelector<HTMLButtonElement>("#settings-save");
  let settingsDebounce: ReturnType<typeof setTimeout> | undefined;

  const closeSettings = () => {
    state.isSettingsPinned = false;
    settingsRoot?.classList.remove("is-pinned");
  };

  const scheduleLoadModels = () => {
    if (settingsDebounce) clearTimeout(settingsDebounce);
    settingsDebounce = setTimeout(() => {
      void loadModels();
    }, 500);
  };

  settingsTrigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    state.isSettingsPinned = !state.isSettingsPinned;
    settingsRoot?.classList.toggle("is-pinned", state.isSettingsPinned);
    if (state.isSettingsPinned && canLoadModels()) {
      void loadModels();
    }
  });

  settingsPopover?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  settingsRoot?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  if (!settingsOutsideClickBound) {
    settingsOutsideClickBound = true;
    document.addEventListener("click", () => {
      if (state.isSettingsPinned) {
        closeSettings();
      }
    });
  }

  baseUrlInput?.addEventListener("input", () => {
    state.baseUrl = baseUrlInput.value;
    scheduleLoadModels();
  });

  apiKeyInput?.addEventListener("input", () => {
    state.apiKey = apiKeyInput.value;
    scheduleLoadModels();
  });

  modelSelect?.addEventListener("change", () => {
    state.selectedModelId = modelSelect.value;
  });

  saveBtn?.addEventListener("click", () => {
    state.baseUrl = resolveBaseUrl(baseUrlInput?.value.trim() ?? state.baseUrl);
    state.apiKey = apiKeyInput?.value.trim() ?? "";
    state.selectedModelId = modelSelect?.value ?? state.selectedModelId;

    if (!state.baseUrl.trim()) {
      state.modelsError = "Enter a Base URL.";
      syncSettingsUI();
      return;
    }

    if (!isTrustedBaseUrl(state.baseUrl)) {
      state.modelsError = "Use an https:// Base URL you trust.";
      syncSettingsUI();
      return;
    }

    setStoredBaseUrl(state.baseUrl);
    setStoredApiKey(state.apiKey);
    setStoredModel(state.selectedModelId);
    state.generationError = null;
    closeSettings();
    render();
  });
}

function canLoadModels(): boolean {
  if (!state.apiKey.trim() || state.apiKey.trim().length < 8) return false;
  if (!state.baseUrl.trim()) return false;
  return isTrustedBaseUrl(state.baseUrl);
}

async function loadModels(): Promise<void> {
  if (!canLoadModels()) return;

  state.modelsLoading = true;
  state.modelsError = null;
  syncSettingsUI();

  try {
    const effect = selectedEffect();
    const imageInputOnly = isAiEffect(effect) ? effect.requiresImageInput !== false : true;
    state.availableModels = await listImageModels(state.apiKey, state.baseUrl, { imageInputOnly });

    const stillValid = state.availableModels.some((model) => model.id === state.selectedModelId);
    if (!stillValid) {
      state.selectedModelId = state.availableModels[0]?.id ?? "";
    }

    if (state.availableModels.length === 0) {
      state.modelsError = "No image-to-image models found for this API key.";
    }
  } catch (error) {
    state.modelsError = error instanceof Error ? error.message : "Failed to load models";
    state.availableModels = [];
    state.selectedModelId = "";
  } finally {
    state.modelsLoading = false;
    syncSettingsUI();
  }
}

function loadFile(file: File): void {
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result as string;
    const img = new Image();
    img.onload = () => {
      state.sourceImage = img;
      state.sourceDataUrl = dataUrl;
      state.aspectRatio = img.naturalWidth / img.naturalHeight;
      state.resultAspectRatio = state.aspectRatio;
      clearAiResults();
      state.generationError = null;
      render();
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

function applyLocalEffect(): void {
  if (!state.sourceImage) return;

  const effect = selectedEffect();
  if (!isLocalEffect(effect)) return;

  const { naturalWidth: width, naturalHeight: height } = state.sourceImage;

  canvas.width = width;
  canvas.height = height;
  effect.apply({
    source: state.sourceImage,
    canvas,
    ctx,
    width,
    height,
    intensity: state.intensity,
  });

  state.resultAspectRatio = state.aspectRatio;
  const resultImage = document.querySelector<HTMLImageElement>("#result-image");
  if (resultImage) {
    resultImage.src = canvas.toDataURL("image/png");
  }
}

async function runAiGeneration(): Promise<void> {
  const effect = selectedEffect();
  if (!isAiEffect(effect) || !state.sourceImage || !state.sourceDataUrl) return;

  if (!state.apiKey.trim()) {
    state.generationError = "Add your API key in Settings.";
    state.isSettingsPinned = true;
    render();
    return;
  }

  if (!state.baseUrl.trim()) {
    state.generationError = "Enter a Base URL in Settings.";
    state.isSettingsPinned = true;
    render();
    return;
  }

  if (!isTrustedBaseUrl(state.baseUrl)) {
    state.generationError = "Use an https:// Base URL you trust.";
    state.isSettingsPinned = true;
    render();
    return;
  }

  if (!state.selectedModelId) {
    state.generationError = "Select a model in Settings.";
    state.isSettingsPinned = true;
    render();
    return;
  }

  state.isGenerating = true;
  state.generationPhase = isAiEffect(effect) && effect.compositePrompt ? "panel" : null;
  state.generationError = null;
  render();

  try {
    const { naturalWidth, naturalHeight } = state.sourceImage;
    const sourceAspectRatio = closestAspectRatio(naturalWidth, naturalHeight);

    if (isAiEffect(effect) && effect.compositePrompt) {
      const panelDataUrl = await generateImage({
        apiKey: state.apiKey,
        baseUrl: state.baseUrl,
        model: state.selectedModelId,
        prompt: effect.prompt,
        inputImageDataUrl: state.sourceDataUrl,
        aspectRatio: sourceAspectRatio,
      });

      const panelImage = await loadImage(panelDataUrl);
      state.aiPanelDataUrl = panelDataUrl;
      state.panelWidth = panelImage.naturalWidth;
      state.panelHeight = panelImage.naturalHeight;
      state.resultAspectRatio = state.aspectRatio;

      state.generationPhase = "artwork";
      render();

      const compositeAspectRatio = closestAspectRatioFromValue(
        getExpectedCompositeAspectRatio(naturalWidth, naturalHeight)
      );
      const compositeDataUrl = await generateImage({
        apiKey: state.apiKey,
        baseUrl: state.baseUrl,
        model: state.selectedModelId,
        prompt: effect.compositePrompt,
        inputImageDataUrl: state.sourceDataUrl,
        aspectRatio: compositeAspectRatio,
      });

      const compositeImage = await loadImage(compositeDataUrl);
      state.aiCompositeDataUrl = compositeDataUrl;
      state.compositeWidth = compositeImage.naturalWidth;
      state.compositeHeight = compositeImage.naturalHeight;
      state.compositeAspectRatio = compositeImage.naturalWidth / compositeImage.naturalHeight;
    } else {
      const resultDataUrl = await generateImage({
        apiKey: state.apiKey,
        baseUrl: state.baseUrl,
        model: state.selectedModelId,
        prompt: effect.prompt,
        inputImageDataUrl: state.sourceDataUrl,
        aspectRatio: sourceAspectRatio,
      });

      const resultImage = await loadImage(resultDataUrl);
      state.aiCompositeDataUrl = resultDataUrl;
      state.compositeWidth = resultImage.naturalWidth;
      state.compositeHeight = resultImage.naturalHeight;
      state.resultAspectRatio = resultImage.naturalWidth / resultImage.naturalHeight;
    }
  } catch (error) {
    state.generationError = error instanceof Error ? error.message : "Generation failed";
    clearAiResults();
  } finally {
    state.isGenerating = false;
    state.generationPhase = null;
    render();
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load generated image"));
    img.src = src;
  });
}

function downloadResult(): void {
  if (!state.sourceImage) return;

  const effect = selectedEffect();
  let href = "";

  if (isAiEffect(effect)) {
    href = isAbstractEditorialSelected() ? state.aiPanelDataUrl ?? "" : state.aiCompositeDataUrl ?? "";
    if (!href) return;
  } else {
    applyLocalEffect();
    href = canvas.toDataURL("image/png");
  }

  const link = document.createElement("a");
  link.download = `${effect.id}-result.png`;
  link.href = href;
  link.click();
}

render();

if (canLoadModels()) {
  void loadModels();
}
