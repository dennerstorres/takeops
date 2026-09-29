import type {
  ApprovalRecord,
  ApprovalRepository,
} from "./approval-repository.ts";
import { prisma } from "./db.ts";

function mapApproval(row: ApprovalRecord): ApprovalRecord {
  return {
    id: row.id,
    videoProjectId: row.videoProjectId,
    editVersionId: row.editVersionId,
    status: row.status,
    requestedById: row.requestedById,
    reviewedById: row.reviewedById,
    notes: row.notes,
    createdAt: row.createdAt,
    reviewedAt: row.reviewedAt,
  };
}

const visibleProject = (workspaceId: string, projectId: string) => ({
  id: projectId,
  workspaceId,
  deletedAt: null,
});

export const prismaApprovalRepository: ApprovalRepository = {
  async list(workspaceId, projectId) {
    const rows = await prisma.approval.findMany({
      where: { videoProject: visibleProject(workspaceId, projectId) },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapApproval);
  },

  async request(workspaceId, projectId, versionId, requestedById) {
    return prisma.$transaction(async (tx) => {
      const version = await tx.editVersion.findFirst({
        where: {
          id: versionId,
          videoProject: visibleProject(workspaceId, projectId),
        },
        select: { id: true, videoProjectId: true },
      });
      if (!version) return { kind: "missing" as const };
      const pending = await tx.approval.findFirst({
        where: { videoProjectId: version.videoProjectId, status: "PENDING" },
      });
      if (pending && pending.editVersionId === version.id) {
        return { kind: "existing" as const, approval: mapApproval(pending) };
      }
      if (pending) {
        return {
          kind: "conflict" as const,
          pendingVersionId: pending.editVersionId,
        };
      }
      const created = await tx.approval.create({
        data: {
          videoProjectId: version.videoProjectId,
          editVersionId: version.id,
          requestedById,
        },
      });
      return { kind: "created" as const, approval: mapApproval(created) };
    });
  },
};
