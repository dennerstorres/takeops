import type { Translate } from "../i18n/translate.ts";

export const shootStatuses = [
  "PLANNED",
  "READY",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELED",
] as const;

export type ShootStatus = (typeof shootStatuses)[number];

export function shootStatusLabel(t: Translate, value: ShootStatus) {
  return t(`enums.shootStatus.${value}`);
}
