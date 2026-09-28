export const shotTypes = [
  "CAMERA",
  "SCREEN_CAPTURE",
  "BROLL",
  "INSERT",
  "VOICE_ONLY",
  "OTHER",
] as const;

export const shotStatuses = [
  "PLANNED",
  "RECORDED",
  "NEEDS_RETAKE",
  "DISCARDED",
] as const;

// Sugestões do campo enquadramento. O campo aceita texto livre.
export const framingPresets = [
  "Extreme Wide",
  "Wide",
  "Medium",
  "Medium Close",
  "Close",
  "Extreme Close",
  "Over Shoulder",
  "POV",
  "Screen",
] as const;

export type ShotType = (typeof shotTypes)[number];
export type ShotStatus = (typeof shotStatuses)[number];

const typeLabels: Record<ShotType, string> = {
  CAMERA: "Câmera",
  SCREEN_CAPTURE: "Captura de tela",
  BROLL: "Apoio",
  INSERT: "Inserto",
  VOICE_ONLY: "Só voz",
  OTHER: "Outro",
};

const statusLabels: Record<ShotStatus, string> = {
  PLANNED: "Planejado",
  RECORDED: "Gravado",
  NEEDS_RETAKE: "Refazer",
  DISCARDED: "Descartado",
};

export function shotTypeLabel(value: ShotType) {
  return typeLabels[value];
}

export function shotStatusLabel(value: ShotStatus) {
  return statusLabels[value];
}
