import type { Translate } from "../i18n/translate.ts";

export const assetTypes = [
  "RAW_FOOTAGE",
  "SCREEN_RECORDING",
  "REFERENCE",
  "AUDIO",
  "IMAGE",
  "PROJECT_FILE",
  "FINAL_EXPORT",
  "FOLDER",
  "OTHER",
] as const;

export type AssetType = (typeof assetTypes)[number];

export function assetTypeLabel(t: Translate, value: AssetType) {
  return t(`enums.assetType.${value}`);
}
