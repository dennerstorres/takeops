import { prisma } from "./db.ts";
import type { UpcomingShootRepository } from "./upcoming-shoot.ts";

export const prismaUpcomingShootRepository: UpcomingShootRepository = {
  async claim(from, to, now) {
    // Um UPDATE só: o Postgres recheca `upcomingNotifiedAt IS NULL` depois do
    // lock, então uma segunda execução simultânea não repete o aviso.
    const rows = await prisma.shoot.updateManyAndReturn({
      where: {
        deletedAt: null,
        upcomingNotifiedAt: null,
        status: { in: ["PLANNED", "READY"] },
        scheduledAt: { gte: from, lt: to },
        videoProject: {
          deletedAt: null,
          status: { notIn: ["PUBLISHED", "ARCHIVED"] },
        },
      },
      data: { upcomingNotifiedAt: now },
      include: {
        videoProject: { select: { workspaceId: true, ownerId: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      workspaceId: row.videoProject.workspaceId,
      videoProjectId: row.videoProjectId,
      ownerId: row.videoProject.ownerId,
    }));
  },
};
