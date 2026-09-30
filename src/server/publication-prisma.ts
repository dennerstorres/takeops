import { prisma } from "./db.ts";
import type {
  PublicationRecord,
  PublicationRepository,
} from "./publication-repository.ts";

function mapPublication(row: PublicationRecord): PublicationRecord {
  return {
    id: row.id,
    videoProjectId: row.videoProjectId,
    platform: row.platform,
    status: row.status,
    scheduledAt: row.scheduledAt,
    publishedAt: row.publishedAt,
    url: row.url,
    caption: row.caption,
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

export const prismaPublicationRepository: PublicationRepository = {
  async list(workspaceId, projectId) {
    const rows = await prisma.publication.findMany({
      where: { videoProject: visibleProject(workspaceId, projectId) },
      orderBy: [{ platform: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(mapPublication);
  },

  async find(workspaceId, projectId, publicationId) {
    const row = await prisma.publication.findFirst({
      where: {
        id: publicationId,
        videoProject: visibleProject(workspaceId, projectId),
      },
    });
    return row ? mapPublication(row) : null;
  },

  async create(workspaceId, projectId, input) {
    const project = await prisma.videoProject.findFirst({
      where: visibleProject(workspaceId, projectId),
      select: { id: true },
    });
    if (!project) return null;
    const created = await prisma.publication.create({
      data: { ...input, videoProjectId: project.id },
    });
    return mapPublication(created);
  },

  async update(workspaceId, projectId, publicationId, input) {
    const result = await prisma.publication.updateMany({
      where: {
        id: publicationId,
        videoProject: visibleProject(workspaceId, projectId),
      },
      data: input,
    });
    if (result.count !== 1) return null;
    return this.find(workspaceId, projectId, publicationId);
  },

  async recordOutcome(workspaceId, projectId, publicationId, input) {
    return prisma.$transaction(async (tx) => {
      const project = await tx.videoProject.findFirst({
        where: visibleProject(workspaceId, projectId),
        select: { id: true, status: true },
      });
      if (!project) return null;
      const result = await tx.publication.updateMany({
        where: { id: publicationId, videoProjectId: project.id },
        data: input,
      });
      if (result.count !== 1) return null;
      let moved: { from: typeof project.status } | null = null;
      // Arquivada fica arquivada; já publicada não muda.
      if (
        input.status === "PUBLISHED" &&
        project.status !== "PUBLISHED" &&
        project.status !== "ARCHIVED"
      ) {
        const changed = await tx.videoProject.updateMany({
          where: { id: project.id, status: project.status },
          data: { status: "PUBLISHED" },
        });
        if (changed.count === 1) moved = { from: project.status };
      }
      const row = await tx.publication.findUnique({
        where: { id: publicationId },
      });
      return row ? { publication: mapPublication(row), moved } : null;
    });
  },

  async remove(workspaceId, projectId, publicationId) {
    const result = await prisma.publication.deleteMany({
      where: {
        id: publicationId,
        videoProject: visibleProject(workspaceId, projectId),
      },
    });
    return result.count === 1;
  },
};
