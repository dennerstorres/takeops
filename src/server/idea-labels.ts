import type { Translate } from "../i18n/translate.ts";

export const ideaFormats = [
  "TUTORIAL",
  "SKETCH",
  "DEMO",
  "FEATURE",
  "INSTITUTIONAL",
  "EDUCATIONAL",
  "BEHIND_THE_SCENES",
  "OTHER",
] as const;

export const ideaStatuses = [
  "NEW",
  "UNDER_REVIEW",
  "APPROVED",
  "DISCARDED",
  "CONVERTED",
] as const;

export type IdeaFormat = (typeof ideaFormats)[number];
export type IdeaStatus = (typeof ideaStatuses)[number];

export function formatLabel(t: Translate, format: IdeaFormat) {
  return t(`enums.ideaFormat.${format}`);
}

export function statusLabel(t: Translate, status: IdeaStatus) {
  return t(`enums.ideaStatus.${status}`);
}
