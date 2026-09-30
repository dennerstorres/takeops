import type { DashboardRepository } from "./dashboard.ts";
import { idleStatuses, openIdeaExcluded } from "./dashboard.ts";
import { prisma } from "./db.ts";
import { mapIdea } from "./idea-prisma.ts";
import { mapProject } from "./project-prisma.ts";

export const prismaDashboardRepository: DashboardRepository = {
  async pendingApprovalProjectIds(workspaceId) {
    const rows = await prisma.approval.findMany({
      where: {
        status: "PENDING",
        videoProject: { workspaceId, deletedAt: null },
      },
      select: { videoProjectId: true },
      distinct: ["videoProjectId"],
    });
    return rows.map((row) => row.videoProjectId);
  },

  async activeProjects(workspaceId) {
    const rows = await prisma.videoProject.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          { status: { notIn: [...idleStatuses] } },
          { approvals: { some: { status: "PENDING" } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(mapProject);
  },

  async projectStatusCounts(workspaceId) {
    const rows = await prisma.videoProject.groupBy({
      by: ["status"],
      where: { workspaceId, deletedAt: null },
      _count: { _all: true },
    });
    return Object.fromEntries(
      rows.map((row) => [row.status, row._count._all]),
    );
  },

  async openIdeas(workspaceId, limit) {
    const where = {
      workspaceId,
      deletedAt: null,
      status: { notIn: [...openIdeaExcluded] },
    };
    const [total, rows] = await Promise.all([
      prisma.idea.count({ where }),
      prisma.idea.findMany({
        where,
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);
    return { total, recent: rows.map(mapIdea) };
  },
};
