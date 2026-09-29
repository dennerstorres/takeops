import type { Translate } from "../i18n/translate.ts";

export const platforms = [
  "INSTAGRAM_REELS",
  "TIKTOK",
  "YOUTUBE_SHORTS",
  "YOUTUBE",
  "LINKEDIN",
  "FACEBOOK",
  "OTHER",
] as const;

export const publicationStatuses = [
  "PENDING",
  "SCHEDULED",
  "PUBLISHED",
  "FAILED",
  "CANCELED",
] as const;

export type Platform = (typeof platforms)[number];
export type PublicationStatus = (typeof publicationStatuses)[number];

export function platformLabel(t: Translate, value: Platform) {
  return t(`enums.platform.${value}`);
}

export function publicationStatusLabel(t: Translate, value: PublicationStatus) {
  return t(`enums.publicationStatus.${value}`);
}

export function isPlatform(value: unknown): value is Platform {
  return (platforms as readonly unknown[]).includes(value);
}
