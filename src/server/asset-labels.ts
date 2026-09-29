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

const typeLabels: Record<AssetType, string> = {
  RAW_FOOTAGE: "Material bruto",
  SCREEN_RECORDING: "Gravação de tela",
  REFERENCE: "Referência",
  AUDIO: "Áudio",
  IMAGE: "Imagem",
  PROJECT_FILE: "Projeto de edição",
  FINAL_EXPORT: "Exportação final",
  FOLDER: "Pasta",
  OTHER: "Outro",
};

export function assetTypeLabel(value: AssetType) {
  return typeLabels[value];
}
