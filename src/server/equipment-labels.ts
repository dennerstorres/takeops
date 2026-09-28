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

const categoryLabels: Record<EquipmentCategory, string> = {
  CAMERA: "Câmera",
  SMARTPHONE: "Smartphone",
  MICROPHONE: "Microfone",
  TRIPOD: "Tripé",
  LIGHTING: "Iluminação",
  POWER: "Energia",
  LAPTOP: "Notebook",
  OTHER: "Outros",
};

export function equipmentCategoryLabel(value: EquipmentCategory) {
  return categoryLabels[value];
}
