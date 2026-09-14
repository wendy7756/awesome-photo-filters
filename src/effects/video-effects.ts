import type { VideoEffect } from "./types";

export const FINGER_FRAME_ID = "finger-frame";

export const fingerFrameEffect: VideoEffect = {
  kind: "video",
  id: FINGER_FRAME_ID,
  name: "Finger Frame",
  description:
    "Upload a finger-frame dance clip; AI stylizes the scene and reveals it inside the hand window.",
  sourceUrl: "https://github.com/sophiamyang/finger-frame-effect-ai",
};

export const videoEffects: VideoEffect[] = [fingerFrameEffect];
