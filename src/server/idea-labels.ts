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

const formatLabels: Record<IdeaFormat, string> = {
  TUTORIAL: "Tutorial",
  SKETCH: "Esquete",
  DEMO: "Demonstração",
  FEATURE: "Funcionalidade",
  INSTITUTIONAL: "Institucional",
  EDUCATIONAL: "Educativo",
  BEHIND_THE_SCENES: "Bastidores",
  OTHER: "Outro",
};

const statusLabels: Record<IdeaStatus, string> = {
  NEW: "Nova",
  UNDER_REVIEW: "Em análise",
  APPROVED: "Aprovada",
  DISCARDED: "Descartada",
  CONVERTED: "Convertida",
};

export function formatLabel(format: IdeaFormat) {
  return formatLabels[format];
}

export function statusLabel(status: IdeaStatus) {
  return statusLabels[status];
}
