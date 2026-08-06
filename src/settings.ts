export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const API_KEY_STORAGE = "ave.apiKey";
const MODEL_STORAGE = "ave.model";
const BASE_URL_STORAGE = "ave.baseUrl";

/** @deprecated kept for migration */
const LEGACY_API_KEY_STORAGE = "ave.openrouter.apiKey";
const LEGACY_MODEL_STORAGE = "ave.openrouter.model";

export function getStoredApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) ?? localStorage.getItem(LEGACY_API_KEY_STORAGE) ?? "";
}

export function setStoredApiKey(apiKey: string): void {
  if (apiKey.trim()) {
    localStorage.setItem(API_KEY_STORAGE, apiKey.trim());
  } else {
    localStorage.removeItem(API_KEY_STORAGE);
  }
}

export function getStoredModel(): string {
  return localStorage.getItem(MODEL_STORAGE) ?? localStorage.getItem(LEGACY_MODEL_STORAGE) ?? "";
}

export function setStoredModel(modelId: string): void {
  if (modelId.trim()) {
    localStorage.setItem(MODEL_STORAGE, modelId.trim());
  } else {
    localStorage.removeItem(MODEL_STORAGE);
  }
}

export function getStoredBaseUrl(): string {
  return localStorage.getItem(BASE_URL_STORAGE) ?? "";
}

export function setStoredBaseUrl(baseUrl: string): void {
  const normalized = normalizeBaseUrl(baseUrl);
  if (normalized) {
    localStorage.setItem(BASE_URL_STORAGE, normalized);
  } else {
    localStorage.removeItem(BASE_URL_STORAGE);
  }
}

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

export function resolveBaseUrl(baseUrl: string): string {
  return normalizeBaseUrl(baseUrl);
}

export function isTrustedBaseUrl(baseUrl: string): boolean {
  try {
    const { protocol, hostname } = new URL(normalizeBaseUrl(baseUrl));
    return protocol === "https:" || (protocol === "http:" && hostname === "localhost");
  } catch {
    return false;
  }
}
