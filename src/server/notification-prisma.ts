import { prisma } from "./db.ts";
import { isNotificationType } from "./notification-labels.ts";
import type {
  NotificationMetadata,
  NotificationRecord,
  NotificationRepository,
} from "./notification-repository.ts";

export const prismaNotificationRepository: NotificationRepository = {
  async create(input, userIds) {
    if (userIds.length === 0) return 0;
    // Destinatário que saiu do workspace não recebe aviso.
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: input.workspaceId, userId: { in: userIds } },
      select: { userId: true },
    });
    if (members.length === 0) return 0;
    const result = await prisma.notification.createMany({
      data: members.map((member) => ({
        workspaceId: input.workspaceId,
        userId: member.userId,
        actorId: input.actorId,
        videoProjectId: input.videoProjectId,
        type: input.type,
        metadata: input.metadata ?? undefined,
      })),
    });
    return result.count;
  },

  async listForUser(userId, workspaceId, limit) {
    const rows = await prisma.notification.findMany({
      where: { userId, workspaceId },
      include: { videoProject: { select: { title: true, deletedAt: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.flatMap((row): NotificationRecord[] =>
      isNotificationType(row.type)
        ? [
            {
              id: row.id,
              workspaceId: row.workspaceId,
              userId: row.userId,
              actorId: row.actorId,
              videoProjectId: row.videoProject?.deletedAt
                ? null
                : row.videoProjectId,
              projectTitle: row.videoProject?.deletedAt
                ? null
                : (row.videoProject?.title ?? null),
              type: row.type,
              metadata:
                row.metadata && typeof row.metadata === "object"
                  ? (row.metadata as NotificationMetadata)
                  : null,
              readAt: row.readAt,
              createdAt: row.createdAt,
            },
          ]
        : [],
    );
  },

  async countUnread(userId, workspaceId) {
    return prisma.notification.count({
      where: { userId, workspaceId, readAt: null },
    });
  },

  async markRead(userId, workspaceId, notificationId, at) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        workspaceId,
        readAt: null,
        ...(notificationId ? { id: notificationId } : {}),
      },
      data: { readAt: at },
    });
    return result.count;
  },
};
