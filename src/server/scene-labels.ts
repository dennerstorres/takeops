export const sceneTypes = [
  "HOOK",
  "TALKING_HEAD",
  "DIALOGUE",
  "SCREEN_CAPTURE",
  "BROLL",
  "PRODUCT",
  "VOICE_OVER",
  "CTA",
  "OTHER",
] as const;

export const sceneStatuses = [
  "PLANNED",
  "READY",
  "RECORDING",
  "RECORDED",
  "NEEDS_RETAKE",
  "DISCARDED",
] as const;

export type SceneType = (typeof sceneTypes)[number];
export type SceneStatus = (typeof sceneStatuses)[number];
