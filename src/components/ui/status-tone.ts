// Mapa de DESIGN.md: status sempre com texto + cor.
// Chaves iguais entre enums concordam no tom (APPROVED, PENDING, CANCELED…).
export const statusTones = [
  "muted",
  "info",
  "primary",
  "warning",
  "success",
  "destructive",
] as const;

export type StatusTone = (typeof statusTones)[number];

const toneByStatus: Record<string, StatusTone> = {
  NEW: "muted",
  IDEA: "muted",
  PLANNED: "muted",
  ARCHIVED: "muted",
  CANCELED: "muted",
  UNDER_REVIEW: "info",
  PRE_PRODUCTION: "info",
  SCRIPTING: "info",
  READY_TO_RECORD: "info",
  READY: "info",
  REVIEW: "info",
  SCHEDULED: "info",
  RECORDING: "primary",
  EDITING: "primary",
  IN_PROGRESS: "primary",
  NEEDS_RETAKE: "warning",
  RETAKE: "warning",
  PENDING: "warning",
  EXPIRED: "warning",
  CHANGES_REQUESTED: "warning",
  APPROVED: "success",
  CONVERTED: "success",
  RECORDED: "success",
  COMPLETED: "success",
  OK: "success",
  PUBLISHED: "success",
  ACCEPTED: "success",
  DISCARDED: "destructive",
  FAILED: "destructive",
  REVOKED: "destructive",
};

export function statusTone(status: string): StatusTone {
  return toneByStatus[status] ?? "muted";
}
