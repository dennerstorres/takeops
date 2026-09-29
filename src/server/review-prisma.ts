import { prisma } from "./db.ts";
import type {
  ReviewCommentRecord,
  ReviewRepository,
  ReviewScope,
} from "./review-repository.ts";

function mapComment(row: ReviewCommentRecord): ReviewCommentRecord {
  return {
    id: row.id,
    editVersionId: row.editVersionId,
    authorId: row.authorId,
    timestampSeconds: row.timestampSeconds,
    text: row.text,
    resolved: row.resolved,
    resolvedById: row.resolvedById,
    resolvedAt: row.resolvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const visibleVersion = (scope: ReviewScope) => ({
  id: scope.versionId,
  videoProject: {
    id: scope.projectId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  },
});

export const prismaReviewRepository: ReviewRepository = {
  async list(scope) {
    const rows = await prisma.reviewComment.findMany({
      where: { editVersion: visibleVersion(scope) },
      orderBy: [
        { timestampSeconds: { sort: "asc", nulls: "last" } },
        { createdAt: "asc" },
      ],
    });
    return rows.map(mapComment);
  },

  async create(scope, input) {
    const version = await prisma.editVersion.findFirst({
      where: visibleVersion(scope),
      select: { id: true },
    });
    if (!version) return null;
    const created = await prisma.reviewComment.create({
      data: { ...input, editVersionId: version.id },
    });
    return mapComment(created);
  },
};
