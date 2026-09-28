export const shootStatuses = [
  "PLANNED",
  "READY",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELED",
] as const;

export type ShootStatus = (typeof shootStatuses)[number];

const statusLabels: Record<ShootStatus, string> = {
  PLANNED: "Planejada",
  READY: "Pronta",
  IN_PROGRESS: "Gravando",
  COMPLETED: "Concluída",
  CANCELED: "Cancelada",
};

export function shootStatusLabel(value: ShootStatus) {
  return statusLabels[value];
}
