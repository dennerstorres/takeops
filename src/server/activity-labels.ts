// Lista fechada do que vira atividade (spec §41, PLAN ACTIVITY-002). Ação
// fora daqui não é gravada: evita string solta e log técnico.
export const activityActions = [
  "PROJECT_CREATED",
  "PROJECT_STATUS_CHANGED",
  "VERSION_CREATED",
  "APPROVAL_REQUESTED",
  "CHANGES_REQUESTED",
  "VERSION_APPROVED",
  "PUBLICATION_SCHEDULED",
  "PUBLICATION_RECORDED",
] as const;

export type ActivityAction = (typeof activityActions)[number];

export function isActivityAction(value: string): value is ActivityAction {
  return (activityActions as readonly string[]).includes(value);
}

type Metadata = Record<string, unknown> | null;

function text(metadata: Metadata, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : null;
}

// Frase curta no tom da spec: "Denner adicionou a versão V2."
export function describeActivity(
  actor: string,
  action: ActivityAction,
  metadata: Metadata,
) {
  switch (action) {
    case "PROJECT_CREATED":
      return `${actor} criou a produção.`;
    case "PROJECT_STATUS_CHANGED": {
      const to = text(metadata, "toLabel");
      return to
        ? `${actor} moveu a produção para ${to}.`
        : `${actor} mudou a etapa da produção.`;
    }
    case "VERSION_CREATED": {
      const version = text(metadata, "version");
      return version
        ? `${actor} adicionou a versão ${version}.`
        : `${actor} adicionou uma versão.`;
    }
    case "APPROVAL_REQUESTED":
      return `${actor} pediu aprovação${versionSuffix(metadata)}.`;
    case "CHANGES_REQUESTED":
      return `${actor} solicitou alterações${versionSuffix(metadata)}.`;
    case "VERSION_APPROVED":
      return `${actor} aprovou o vídeo${versionSuffix(metadata)}.`;
    case "PUBLICATION_SCHEDULED": {
      const platform = text(metadata, "platform");
      return platform
        ? `${actor} agendou a publicação em ${platform}.`
        : `${actor} agendou uma publicação.`;
    }
    case "PUBLICATION_RECORDED": {
      const platform = text(metadata, "platform");
      const outcome = text(metadata, "outcome");
      return `${actor} registrou ${outcome ?? "o resultado da publicação"}${
        platform ? ` em ${platform}` : ""
      }.`;
    }
  }
}

function versionSuffix(metadata: Metadata) {
  const version = text(metadata, "version");
  return version ? ` da ${version}` : "";
}
