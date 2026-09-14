/** Finger-frame effect constants — ported from finger-frame-effect-ai. */

export const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

export const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
export const GEMINI_MODEL = "gemini-omni-flash-preview";

export const WRIST = 0;
export const THUMB_TIP = 4;
export const INDEX_TIP = 8;
export const MIDDLE_MCP = 9;

export const MAX_LOST_FRAMES = 25;
export const JUMP_CONFIRM_FRAMES = 2;

export const STYLES: Record<string, string> = {
  movie3d:
    "Transform the person into a 3D animated movie character (stylized CGI animation look, expressive big eyes, soft lighting).",
  anime:
    "Redraw the video as a hand-drawn anime with clean line art, cel shading, and vibrant colors.",
  clay: "Transform the scene into claymation stop-motion with visible clay texture.",
  watercolor: "Repaint the video as a soft watercolor painting with loose brushwork.",
};

export const PROMPT_SUFFIX =
  " This is a strict pixel-aligned edit of the source video: keep the same pose, motion, timing, clothing colors, and background. The camera must not change — no zoom, no crop, no recentering, and no change to the field of view. The person's face and body must stay at exactly the same position and size in the frame as the source: eyes, nose, and mouth must remain at the same screen coordinates in every frame. Match the facial expression exactly, frame by frame: preserve the exact degree of mouth openness at every moment — if the mouth is slightly open and still, keep it slightly open and still; do not close it, and do not add talking or any mouth movement that is not in the source. Mirror blinks, gaze direction, and eyebrow position at the same moments as the source. Change only the visual style, nothing about the geometry, composition, or performance.";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export type Point = { x: number; y: number };

export type StyleKey = keyof typeof STYLES | "custom";
