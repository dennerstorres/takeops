// Lista fechada de avisos (spec §40). Tipo fora daqui não é gravado.
export const notificationTypes = [
  "PROJECT_MEMBER_ADDED",
  "VERSION_CREATED",
  "REVIEW_COMMENT_CREATED",
  "CHANGES_REQUESTED",
  "VERSION_APPROVED",
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
  actor: string,
  type: NotificationType,
  projectTitle: string | null,
  metadata: Metadata,
) {
  const project = projectTitle ? ` em ${projectTitle}` : "";
  const version = text(metadata, "version");
  switch (type) {
    case "PROJECT_MEMBER_ADDED":
      return `${actor} adicionou você à produção${projectTitle ? ` ${projectTitle}` : ""}.`;
    case "VERSION_CREATED":
      return `Nova versão${version ? ` ${version}` : ""}${project} disponível.`;
    case "REVIEW_COMMENT_CREATED":
      return `${actor} comentou${version ? ` a ${version}` : ""}${project}.`;
    case "CHANGES_REQUESTED":
      return `${actor} solicitou alterações${version ? ` na ${version}` : ""}${project}.`;
    case "VERSION_APPROVED":
      return `${actor} aprovou o vídeo${project}.`;
  }
}
