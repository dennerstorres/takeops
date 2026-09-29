import type { CalendarRepository } from "./calendar-repository.ts";
import { prisma } from "./db.ts";

const visibleProjects = (workspaceId: string) => ({
  workspaceId,
  deletedAt: null,
});

const projectRef = { select: { id: true, title: true } } as const;

export const prismaCalendarRepository: CalendarRepository = {
  async shoots(workspaceId, from, to) {
    const rows = await prisma.shoot.findMany({
      where: {
        deletedAt: null,
        scheduledAt: { gte: from, lt: to },
        videoProject: visibleProjects(workspaceId),
      },
      include: { videoProject: projectRef },
      orderBy: { scheduledAt: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      scheduledAt: row.scheduledAt,
      status: row.status,
      projectId: row.videoProject.id,
      projectTitle: row.videoProject.title,
    }));
  },

  async plannedPublishes(workspaceId, from, to) {
    const rows = await prisma.videoProject.findMany({
      where: {
        ...visibleProjects(workspaceId),
        plannedPublishDate: { gte: from, lt: to },
      },
      select: { id: true, title: true, plannedPublishDate: true },
      orderBy: { plannedPublishDate: "asc" },
    });
    return rows.flatMap((row) =>
      row.plannedPublishDate
        ? [
            {
              projectId: row.id,
              projectTitle: row.title,
              plannedPublishDate: row.plannedPublishDate,
            },
          ]
        : [],
    );
  },

  async publications(workspaceId, from, to) {
    const rows = await prisma.publication.findMany({
      where: {
        videoProject: visibleProjects(workspaceId),
        OR: [
          { scheduledAt: { gte: from, lt: to } },
          { publishedAt: { gte: from, lt: to } },
        ],
      },
      include: { videoProject: projectRef },
    });
    return rows.map((row) => ({
      id: row.id,
      platform: row.platform,
      status: row.status,
      scheduledAt: row.scheduledAt,
      publishedAt: row.publishedAt,
      projectId: row.videoProject.id,
      projectTitle: row.videoProject.title,
    }));
  },
};
