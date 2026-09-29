export const approvalStatuses = [
  "PENDING",
  "CHANGES_REQUESTED",
  "APPROVED",
] as const;

export type ApprovalStatus = (typeof approvalStatuses)[number];

export type ApprovalRecord = {
  id: string;
  videoProjectId: string;
  editVersionId: string;
  status: ApprovalStatus;
  requestedById: string | null;
  reviewedById: string | null;
  notes: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
};

export type ApprovalRequestResult =
  | { kind: "created" | "existing"; approval: ApprovalRecord }
  // Já há pedido aberto para outra versão da mesma produção.
  | { kind: "conflict"; pendingVersionId: string }
  | { kind: "missing" };

// Tudo passa pela produção visível no workspace aberto.
export type ApprovalRepository = {
  list(workspaceId: string, projectId: string): Promise<ApprovalRecord[]>;
  request(
    workspaceId: string,
    projectId: string,
    versionId: string,
    requestedById: string,
  ): Promise<ApprovalRequestResult>;
  // Decide o pedido PENDING e muda o status da produção na mesma
  // transação. null quando o pedido não existe ou já foi decidido.
  decide(
    workspaceId: string,
    projectId: string,
    approvalId: string,
    input: {
      status: Exclude<ApprovalStatus, "PENDING">;
      projectStatus: "EDITING" | "APPROVED";
      reviewedById: string;
      notes: string | null;
      at: Date;
    },
  ): Promise<ApprovalRecord | null>;
};
