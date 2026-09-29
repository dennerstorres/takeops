import { prisma } from "./db.ts";
import type {
  EditVersionRecord,
  EditVersionRepository,
} from "./edit-version-repository.ts";

function mapVersion(row: EditVersionRecord): EditVersionRecord {
  return {
    id: row.id,
    videoProjectId: row.videoProjectId,
    versionNumber: row.versionNumber,
    title: row.title,
    previewUrl: row.previewUrl,
    fileUrl: row.fileUrl,
    notes: row.notes,
    createdById: row.createdById,
    createdAt: row.createdAt,
  };
}

const visibleProject = (workspaceId: string, projectId: string) => ({
  id: projectId,
  workspaceId,
  deletedAt: null,
});

export const prismaEditVersionRepository: EditVersionRepository = {
  async list(workspaceId, projectId) {
    const rows = await prisma.editVersion.findMany({
      where: { videoProject: visibleProject(workspaceId, projectId) },
      orderBy: { versionNumber: "desc" },
    });
    return rows.map(mapVersion);
  },

  async find(workspaceId, projectId, versionId) {
    const row = await prisma.editVersion.findFirst({
      where: {
        id: versionId,
        videoProject: visibleProject(workspaceId, projectId),
      },
    });
    return row ? mapVersion(row) : null;
  },

  async create(workspaceId, projectId, input) {
    const created = await prisma.$transaction(async (tx) => {
      const project = await tx.videoProject.findFirst({
        where: visibleProject(workspaceId, projectId),
        select: { id: true },
      });
      if (!project) return null;
      // O incremento trava a linha da produção até o commit: um segundo
      // envio simultâneo espera e recebe o número seguinte, sem conflito.
      // Ler o máximo das versões deixaria dois envios com o mesmo número.
      const counter = await tx.videoProject.update({
        where: { id: project.id },
        data: { lastEditVersionNumber: { increment: 1 } },
        select: { lastEditVersionNumber: true },
      });
      return tx.editVersion.create({
        data: {
          ...input,
          videoProjectId: project.id,
          versionNumber: counter.lastEditVersionNumber,
        },
      });
    });
    return created ? mapVersion(created) : null;
  },
};
