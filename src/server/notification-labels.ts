import type { Translate } from "../i18n/translate.ts";

// Lista fechada de avisos (spec §40). Tipo fora daqui não é gravado.
export const notificationTypes = [
  "PROJECT_MEMBER_ADDED",
  "VERSION_CREATED",
  "REVIEW_COMMENT_CREATED",
  "CHANGES_REQUESTED",
  "VERSION_APPROVED",
  "SHOOT_UPCOMING",
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export function isNotificationType(value: string): value is NotificationType {
  return (notificationTypes as readonly string[]).includes(value);
}

type Metadata = Record<string, unknown> | null;

function text(metadata: Metadata, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : null;
}

export function describeNotification(
  t: Translate,
  actor: string,
  type: NotificationType,
  projectTitle: string | null,
  metadata: Metadata,
) {
  const version = text(metadata, "version");
  const shoot = text(metadata, "shoot");
  return t(`notifications.types.${type}`, {
    actor,
    hasProject: projectTitle ? "yes" : "no",
    project: projectTitle ?? "",
    hasVersion: version ? "yes" : "no",
    version: version ?? "",
    hasShoot: shoot ? "yes" : "no",
    shoot: shoot ?? "",
  });
}
