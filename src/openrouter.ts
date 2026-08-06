import { normalizeBaseUrl } from "./settings";

export interface ImageModel {
  id: string;
  name: string;
  description: string;
  supportsImageInput: boolean;
}

interface ImageModelsListResponse {
  data: Array<{
    id: string;
    name: string;
    description: string;
    architecture?: {
      input_modalities?: string[];
    };
  }>;
}

interface ImageGenerationResponse {
  data: Array<{
    b64_json: string;
    media_type?: string;
  }>;
  error?: {
    message?: string;
  };
}

function buildHeaders(apiKey: string, baseUrl: string): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };

  if (baseUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = window.location.origin;
    headers["X-Title"] = "Awesome Photo Filters";
  }

  return headers;
}

export async function listImageModels(
  apiKey: string,
  baseUrl: string,
  options?: { imageInputOnly?: boolean }
): Promise<ImageModel[]> {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const response = await fetch(`${normalizedBase}/images/models`, {
    headers: buildHeaders(apiKey, normalizedBase),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `Failed to load models (${response.status})`);
  }

  const payload = (await response.json()) as ImageModelsListResponse;
  const models = (payload.data ?? [])
    .map((model) => ({
      id: model.id,
      name: model.name,
      description: model.description,
      supportsImageInput: model.architecture?.input_modalities?.includes("image") ?? false,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (options?.imageInputOnly) {
    return models.filter((model) => model.supportsImageInput);
  }

  return models;
}

export async function generateImage(options: {
  apiKey: string;
  baseUrl: string;
  model: string;
  prompt: string;
  inputImageDataUrl: string;
  aspectRatio?: string;
}): Promise<string> {
  const normalizedBase = normalizeBaseUrl(options.baseUrl);
  const response = await fetch(`${normalizedBase}/images`, {
    method: "POST",
    headers: {
      ...buildHeaders(options.apiKey, normalizedBase),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      prompt: options.prompt,
      input_references: [
        {
          type: "image_url",
          image_url: { url: options.inputImageDataUrl },
        },
      ],
      aspect_ratio: options.aspectRatio ?? "auto",
      output_format: "png",
    }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `Image generation failed (${response.status})`);
  }

  const payload = (await response.json()) as ImageGenerationResponse;
  const image = payload.data?.[0];

  if (!image?.b64_json) {
    throw new Error(payload.error?.message || "No image returned from API");
  }

  const mime = image.media_type || "image/png";
  return `data:${mime};base64,${image.b64_json}`;
}

async function readErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const payload = (await response.json()) as { error?: { message?: string }; message?: string };
    return payload.error?.message || payload.message;
  } catch {
    return undefined;
  }
}

export function closestAspectRatio(width: number, height: number): string {
  return closestAspectRatioFromValue(width / height);
}

export function closestAspectRatioFromValue(ratio: number): string {
  const options: Array<[string, number]> = [
    ["9:16", 9 / 16],
    ["2:3", 2 / 3],
    ["3:4", 3 / 4],
    ["4:5", 4 / 5],
    ["1:1", 1],
    ["5:4", 5 / 4],
    ["4:3", 4 / 3],
    ["3:2", 3 / 2],
    ["16:9", 16 / 9],
    ["2:1", 2],
  ];

  let best = "auto";
  let bestDelta = Number.POSITIVE_INFINITY;

  for (const [label, value] of options) {
    const delta = Math.abs(ratio - value);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = label;
    }
  }

  return best;
}

export { DEFAULT_OPENROUTER_BASE_URL } from "./settings";
