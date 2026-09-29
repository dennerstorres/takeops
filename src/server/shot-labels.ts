import type { Translate } from "../i18n/translate.ts";

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

export function shotTypeLabel(t: Translate, value: ShotType) {
  return t(`enums.shotType.${value}`);
}

export function shotStatusLabel(t: Translate, value: ShotStatus) {
  return t(`enums.shotStatus.${value}`);
}

// Linha curta para ler o plano sem abrir o formulário.
export function shotSummary(
  t: Translate,
  shot: {
    shotType: ShotType;
    framing: string | null;
    cameraLabel: string | null;
    requiredTakes: number;
  },
) {
  return [
    shotTypeLabel(t, shot.shotType),
    shot.framing,
    shot.cameraLabel,
    t("labels.takes", { count: shot.requiredTakes }),
  ]
    .filter(Boolean)
    .join(" · ");
}

// Shot sem nome aparece como A, B, C na ordem da cena, como na spec.
export function shotDisplayName(
  t: Translate,
  name: string | null,
  index: number,
) {
  if (name) return name;
  return t("labels.shot", {
    name: index < 26 ? String.fromCharCode(65 + index) : String(index + 1),
  });
}
