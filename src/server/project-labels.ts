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

const aspectLabels: Record<AspectRatio, string> = {
  NINE_SIXTEEN: "9:16",
  SIXTEEN_NINE: "16:9",
  ONE_ONE: "1:1",
  FOUR_FIVE: "4:5",
};

const priorityLabels: Record<ProjectPriority, string> = {
  LOW: "Baixa",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const statusLabels: Record<VideoProjectStatus, string> = {
  IDEA: "Ideia",
  PRE_PRODUCTION: "Pré-produção",
  SCRIPTING: "Roteiro",
  READY_TO_RECORD: "Pronto para gravar",
  RECORDING: "Gravação",
  EDITING: "Edição",
  REVIEW: "Revisão",
  APPROVED: "Aprovado",
  SCHEDULED: "Agendado",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};

export function aspectLabel(value: AspectRatio) {
  return aspectLabels[value];
}

export function priorityLabel(value: ProjectPriority) {
  return priorityLabels[value];
}

export function projectStatusLabel(value: VideoProjectStatus) {
  return statusLabels[value];
}
