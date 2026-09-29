import type { Translate } from "../i18n/translate.ts";

export const aspectRatios = [
  "NINE_SIXTEEN",
  "SIXTEEN_NINE",
  "ONE_ONE",
  "FOUR_FIVE",
] as const;

export const projectPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export const videoProjectStatuses = [
  "IDEA",
  "PRE_PRODUCTION",
  "SCRIPTING",
  "READY_TO_RECORD",
  "RECORDING",
  "EDITING",
  "REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export type AspectRatio = (typeof aspectRatios)[number];
export type ProjectPriority = (typeof projectPriorities)[number];
export type VideoProjectStatus = (typeof videoProjectStatuses)[number];

export function aspectLabel(t: Translate, value: AspectRatio) {
  return t(`enums.aspectRatio.${value}`);
}

export function priorityLabel(t: Translate, value: ProjectPriority) {
  return t(`enums.priority.${value}`);
}

export function projectStatusLabel(t: Translate, value: VideoProjectStatus) {
  return t(`enums.projectStatus.${value}`);
}

export function isProjectStatus(value: unknown): value is VideoProjectStatus {
  return (videoProjectStatuses as readonly unknown[]).includes(value);
}
