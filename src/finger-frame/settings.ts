const GEMINI_KEY_STORAGE = "ave.gemini.apiKey";
const GEMINI_REMEMBER_STORAGE = "ave.gemini.remember";
const STYLE_STORAGE = "ave.fingerFrame.style";
const STYLE_CUSTOM_STORAGE = "ave.fingerFrame.styleCustom";

export function getStoredGeminiKey(): string {
  return (
    localStorage.getItem(GEMINI_KEY_STORAGE) ??
    sessionStorage.getItem(GEMINI_KEY_STORAGE) ??
    ""
  );
}

export function setStoredGeminiKey(apiKey: string, remember: boolean): void {
  localStorage.removeItem(GEMINI_KEY_STORAGE);
  sessionStorage.removeItem(GEMINI_KEY_STORAGE);
  const trimmed = apiKey.trim();
  if (!trimmed) return;
  (remember ? localStorage : sessionStorage).setItem(GEMINI_KEY_STORAGE, trimmed);
}

export function getGeminiRemember(): boolean {
  return localStorage.getItem(GEMINI_REMEMBER_STORAGE) === "1";
}

export function setGeminiRemember(remember: boolean): void {
  if (remember) {
    localStorage.setItem(GEMINI_REMEMBER_STORAGE, "1");
  } else {
    localStorage.removeItem(GEMINI_REMEMBER_STORAGE);
  }
}

export function getStoredStyle(): string {
  return localStorage.getItem(STYLE_STORAGE) ?? "movie3d";
}

export function setStoredStyle(style: string): void {
  localStorage.setItem(STYLE_STORAGE, style);
}

export function getStoredCustomStyle(): string {
  return localStorage.getItem(STYLE_CUSTOM_STORAGE) ?? "";
}

export function setStoredCustomStyle(prompt: string): void {
  localStorage.setItem(STYLE_CUSTOM_STORAGE, prompt);
}
