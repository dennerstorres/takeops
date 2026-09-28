export const sceneTypes = [
  "HOOK",
  "TALKING_HEAD",
  "DIALOGUE",
  "SCREEN_CAPTURE",
  "BROLL",
  "PRODUCT",
  "VOICE_OVER",
  "CTA",
  "OTHER",
] as const;

export const sceneStatuses = [
  "PLANNED",
  "READY",
  "RECORDING",
  "RECORDED",
  "NEEDS_RETAKE",
  "DISCARDED",
] as const;

export type SceneType = (typeof sceneTypes)[number];
export type SceneStatus = (typeof sceneStatuses)[number];

const typeLabels: Record<SceneType, string> = {
  HOOK: "Gancho",
  TALKING_HEAD: "Apresentador",
  DIALOGUE: "Diálogo",
  SCREEN_CAPTURE: "Tela",
  BROLL: "Apoio",
  PRODUCT: "Produto",
  VOICE_OVER: "Narração",
  CTA: "Chamada",
  OTHER: "Outro",
};

const statusLabels: Record<SceneStatus, string> = {
  PLANNED: "Planejada",
  READY: "Pronta",
  RECORDING: "Gravando",
  RECORDED: "Gravada",
  NEEDS_RETAKE: "Refazer",
  DISCARDED: "Descartada",
};

export function sceneTypeLabel(value: SceneType) {
  return typeLabels[value];
}

export function sceneStatusLabel(value: SceneStatus) {
  return statusLabels[value];
}
