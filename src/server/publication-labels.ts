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

const platformLabels: Record<Platform, string> = {
  INSTAGRAM_REELS: "Instagram Reels",
  TIKTOK: "TikTok",
  YOUTUBE_SHORTS: "YouTube Shorts",
  YOUTUBE: "YouTube",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  OTHER: "Outra",
};

const statusLabels: Record<PublicationStatus, string> = {
  PENDING: "A publicar",
  SCHEDULED: "Agendada",
  PUBLISHED: "Publicada",
  FAILED: "Falhou",
  CANCELED: "Cancelada",
};

export function platformLabel(value: Platform) {
  return platformLabels[value];
}

export function publicationStatusLabel(value: PublicationStatus) {
  return statusLabels[value];
}
