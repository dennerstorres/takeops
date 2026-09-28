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

// Linha curta para ler o plano sem abrir o formulário.
export function shotSummary(shot: {
  shotType: ShotType;
  framing: string | null;
  cameraLabel: string | null;
  requiredTakes: number;
}) {
  return [
    shotTypeLabel(shot.shotType),
    shot.framing,
    shot.cameraLabel,
    shot.requiredTakes === 1 ? "1 take" : `${shot.requiredTakes} takes`,
  ]
    .filter(Boolean)
    .join(" · ");
}

// Shot sem nome aparece como A, B, C na ordem da cena, como na spec.
export function shotDisplayName(name: string | null, index: number) {
  if (name) return name;
  return `Shot ${index < 26 ? String.fromCharCode(65 + index) : index + 1}`;
}
