import type { Translate } from "../i18n/translate.ts";

export const equipmentCategories = [
  "CAMERA",
  "SMARTPHONE",
  "MICROPHONE",
  "TRIPOD",
  "LIGHTING",
  "POWER",
  "LAPTOP",
  "OTHER",
] as const;

export type EquipmentCategory = (typeof equipmentCategories)[number];

export function equipmentCategoryLabel(t: Translate, value: EquipmentCategory) {
  return t(`enums.equipmentCategory.${value}`);
}
