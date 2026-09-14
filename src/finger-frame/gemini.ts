import { GEMINI_BASE, GEMINI_MODEL, MAX_UPLOAD_BYTES, PROMPT_SUFFIX, STYLES } from "./constants";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function gemFetch(key: string, path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${GEMINI_BASE}/${path}`, {
    ...init,
    headers: {
      "x-goog-api-key": key,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const payload = (await res.json()) as { error?: { message?: string } };
      detail = payload.error?.message ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status}: ${detail.slice(0, 160)}`);
  }
  return res.json();
}

function findOutputVideo(inter: Record<string, unknown>): Record<string, unknown> | null {
  if (inter.output_video) return inter.output_video as Record<string, unknown>;
  if (inter.outputVideo) return inter.outputVideo as Record<string, unknown>;

  const lists: unknown[][] = [];
  for (const key of ["outputs", "output", "content"]) {
    if (Array.isArray(inter[key])) lists.push(inter[key] as unknown[]);
  }
  for (const step of (inter.steps as unknown[]) ?? []) {
    if (step && typeof step === "object" && Array.isArray((step as { content?: unknown[] }).content)) {
      lists.push((step as { content: unknown[] }).content);
    }
  }
  for (const list of lists) {
    const match = list.find((item) => {
      if (!item || typeof item !== "object") return false;
      const obj = item as Record<string, unknown>;
      const type = String(obj.type ?? "");
      return type.includes("video") || Boolean(obj.video) || String(obj.mime_type ?? "").startsWith("video");
    }) as Record<string, unknown> | undefined;
    if (match) return (match.video as Record<string, unknown>) ?? match;
  }
  return null;
}

function isPending(inter: Record<string, unknown>): boolean {
  const status = String(inter.status ?? inter.state ?? "").toLowerCase();
  return ["pending", "in_progress", "processing", "running", "queued"].some((k) =>
    status.includes(k)
  );
}

export function buildStylePrompt(styleKey: string, customPrompt: string): string {
  const style =
    styleKey === "custom" && customPrompt.trim()
      ? customPrompt.trim()
      : STYLES[styleKey] ?? STYLES.movie3d;
  return style + PROMPT_SUFFIX;
}

export async function stylizeVideo(options: {
  apiKey: string;
  videoFile: File;
  styleKey: string;
  customPrompt: string;
  onStatus: (message: string) => void;
}): Promise<Blob> {
  const { apiKey, videoFile, styleKey, customPrompt, onStatus } = options;

  if (videoFile.size > MAX_UPLOAD_BYTES) {
    throw new Error("Keep the video under ~15MB (a few seconds of 720p) for inline upload.");
  }

  onStatus("Encoding video…");
  const b64 = await fileToBase64(videoFile);

  onStatus("Submitting to Gemini Omni Flash — this can take a few minutes…");
  let inter = (await gemFetch(apiKey, "interactions", {
    method: "POST",
    body: JSON.stringify({
      model: GEMINI_MODEL,
      input: [
        { type: "video", mime_type: videoFile.type || "video/mp4", data: b64 },
        { type: "text", text: buildStylePrompt(styleKey, customPrompt) },
      ],
    }),
  })) as Record<string, unknown>;

  const id = String(inter.id ?? inter.name ?? "");
  let waited = 0;
  while (isPending(inter) && waited < 600) {
    await sleep(5000);
    waited += 5;
    inter = (await gemFetch(apiKey, `interactions/${id}`)) as Record<string, unknown>;
    onStatus(`Generating… (${waited}s, status: ${String(inter.status ?? inter.state ?? "working")})`);
  }

  const vid = findOutputVideo(inter);
  if (!vid) {
    throw new Error("No video in Gemini response.");
  }

  if (vid.data) {
    const bytes = Uint8Array.from(atob(String(vid.data)), (c) => c.charCodeAt(0));
    return new Blob([bytes], { type: String(vid.mime_type ?? "video/mp4") });
  }

  let uri = String(vid.uri ?? vid.file_uri ?? vid.url ?? "");
  if (!uri) throw new Error("No video data or uri in Gemini response.");

  const fileName = uri.includes("/files/")
    ? `files/${uri.split("/files/")[1].split(/[?#]/)[0]}`
    : uri;
  if (!/^https?:/.test(uri)) {
    uri = `${GEMINI_BASE}/${fileName}:download?alt=media`;
  }

  for (let i = 0; i < 60; i++) {
    const fileMeta = (await gemFetch(apiKey, fileName)) as Record<string, unknown>;
    if (String(fileMeta.state ?? "").includes("ACTIVE")) break;
    onStatus(`Waiting for output file… (${String(fileMeta.state ?? "processing").toLowerCase()})`);
    await sleep(5000);
  }

  onStatus("Downloading result…");
  const res = await fetch(uri, { headers: { "x-goog-api-key": apiKey } });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res.blob();
}
