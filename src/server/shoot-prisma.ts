import { prisma } from "./db.ts";
import type { ShootRecord, ShootRepository } from "./shoot-repository.ts";

function mapShoot(row: ShootRecord): ShootRecord {
  return {
    id: row.id,
    videoProjectId: row.videoProjectId,
    title: row.title,
    scheduledAt: row.scheduledAt,
    endAt: row.endAt,
    location: row.location,
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const visibleProject = (workspaceId: string, projectId: string) => ({
  id: projectId,
  workspaceId,
  deletedAt: null,
});

export const prismaShootRepository: ShootRepository = {
  async list(workspaceId, projectId) {
    const rows = await prisma.shoot.findMany({
      where: {
        deletedAt: null,
        videoProject: visibleProject(workspaceId, projectId),
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(mapShoot);
  },

  async find(workspaceId, projectId, shootId) {
    const row = await prisma.shoot.findFirst({
      where: {
        id: shootId,
        deletedAt: null,
        videoProject: visibleProject(workspaceId, projectId),
      },
    });
    return row ? mapShoot(row) : null;
  },

  async create(workspaceId, projectId, input) {
    const project = await prisma.videoProject.findFirst({
      where: visibleProject(workspaceId, projectId),
      select: { id: true },
    });
    if (!project) return null;
    const created = await prisma.shoot.create({
      data: { ...input, videoProjectId: project.id },
    });
    return mapShoot(created);
  },

  async update(workspaceId, projectId, shootId, input) {
    const updated = await prisma.$transaction(async (tx) => {
      const project = await tx.videoProject.findFirst({
        where: visibleProject(workspaceId, projectId),
        select: { id: true },
      });
      if (!project) return null;
      const where = { id: shootId, videoProjectId: project.id, deletedAt: null };
      const current = await tx.shoot.findFirst({
        where,
        select: { scheduledAt: true },
      });
      if (!current) return null;
      // Remarcada: o aviso de gravação próxima vale para a data nova.
      const moved =
        current.scheduledAt.getTime() !== input.scheduledAt.getTime();
      const result = await tx.shoot.updateMany({
        where,
        data: moved ? { ...input, upcomingNotifiedAt: null } : input,
      });
      if (result.count !== 1) return null;
      return tx.shoot.findFirst({ where });
    });
    return updated ? mapShoot(updated) : null;
  },

  async softDelete(workspaceId, projectId, shootId, deletedAt) {
    const project = await prisma.videoProject.findFirst({
      where: visibleProject(workspaceId, projectId),
      select: { id: true },
    });
    if (!project) return false;
    const result = await prisma.shoot.updateMany({
      where: { id: shootId, videoProjectId: project.id, deletedAt: null },
      data: { deletedAt },
    });
    return result.count === 1;
  },
};
