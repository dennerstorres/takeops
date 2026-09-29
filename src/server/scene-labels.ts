import type { Translate } from "../i18n/translate.ts";

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

export function sceneTypeLabel(t: Translate, value: SceneType) {
  return t(`enums.sceneType.${value}`);
}

export function sceneStatusLabel(t: Translate, value: SceneStatus) {
  return t(`enums.sceneStatus.${value}`);
}
