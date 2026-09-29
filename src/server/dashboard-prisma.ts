import type { DashboardRepository } from "./dashboard.ts";
import { prisma } from "./db.ts";

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
};
