import type { ApprovalStatus } from "./approval-repository.ts";

const labels: Record<ApprovalStatus, string> = {
  PENDING: "Aguardando aprovação",
  CHANGES_REQUESTED: "Alterações solicitadas",
  APPROVED: "Aprovada",
};

export function approvalStatusLabel(value: ApprovalStatus) {
  return labels[value];
}
