import type { Translate } from "../i18n/translate.ts";
import { isPlatform, platformLabel } from "./publication-labels.ts";
import { isProjectStatus, projectStatusLabel } from "./project-labels.ts";

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
  "SCRIPT_IMPORTED",
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

// Frase curta no tom da spec: "Ana adicionou a versão V2."
// Metadados guardam códigos; o texto sai no idioma de quem lê. Registros
// antigos guardavam o rótulo em pt-BR (`toLabel`, `platform`) e ainda valem.
export function describeActivity(
  t: Translate,
  actor: string,
  action: ActivityAction,
  metadata: Metadata,
) {
  const version = text(metadata, "version");
  const to = metadata?.to;
  const toText = isProjectStatus(to)
    ? projectStatusLabel(t, to)
    : text(metadata, "toLabel");
  const code = metadata?.platformCode;
  const platform = isPlatform(code)
    ? platformLabel(t, code)
    : text(metadata, "platform");
  return t(`activity.${action}`, {
    actor,
    hasVersion: version ? "yes" : "no",
    version: version ?? "",
    hasTarget: toText ? "yes" : "no",
    to: toText ?? "",
    hasPlatform: platform ? "yes" : "no",
    platform: platform ?? "",
    status: text(metadata, "status") ?? "other",
    scenes: text(metadata, "scenes") ?? "0",
    shots: text(metadata, "shots") ?? "0",
  });
}
