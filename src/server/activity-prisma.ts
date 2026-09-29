import { isActivityAction } from "./activity-labels.ts";
import type {
  ActivityMetadata,
  ActivityRecord,
  ActivityRepository,
} from "./activity-repository.ts";
import { prisma } from "./db.ts";

export const prismaActivityRepository: ActivityRepository = {
  async record(input) {
    await prisma.activityLog.create({
      data: {
        workspaceId: input.workspaceId,
        videoProjectId: input.videoProjectId,
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata ?? undefined,
      },
    });
  },

  async listForProject(workspaceId, projectId, limit) {
    const rows = await prisma.activityLog.findMany({
      where: {
        workspaceId,
        videoProject: { id: projectId, workspaceId, deletedAt: null },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    // Ação que saiu da lista em versão nova do código não quebra a tela.
    return rows.flatMap((row): ActivityRecord[] =>
      isActivityAction(row.action)
        ? [
            {
              id: row.id,
              workspaceId: row.workspaceId,
              videoProjectId: row.videoProjectId,
              userId: row.userId,
              action: row.action,
              entityType: row.entityType,
              entityId: row.entityId,
              metadata:
                row.metadata && typeof row.metadata === "object"
                  ? (row.metadata as ActivityMetadata)
                  : null,
              createdAt: row.createdAt,
            },
          ]
        : [],
    );
  },
};
