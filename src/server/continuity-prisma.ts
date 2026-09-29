import { prisma } from "./db.ts";
import type {
  ContinuityNoteRecord,
  ContinuityRepository,
} from "./continuity-repository.ts";

function mapNote(row: ContinuityNoteRecord): ContinuityNoteRecord {
  return {
    id: row.id,
    videoProjectId: row.videoProjectId,
    category: row.category,
    title: row.title,
    description: row.description,
    createdById: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const visibleProject = (workspaceId: string, projectId: string) => ({
  id: projectId,
  workspaceId,
  deletedAt: null,
});

export const prismaContinuityRepository: ContinuityRepository = {
  async list(workspaceId, projectId) {
    const rows = await prisma.continuityNote.findMany({
      where: { videoProject: visibleProject(workspaceId, projectId) },
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(mapNote);
  },

  async find(workspaceId, projectId, noteId) {
    const row = await prisma.continuityNote.findFirst({
      where: {
        id: noteId,
        videoProject: visibleProject(workspaceId, projectId),
      },
    });
    return row ? mapNote(row) : null;
  },

  async create(workspaceId, projectId, input) {
    const project = await prisma.videoProject.findFirst({
      where: visibleProject(workspaceId, projectId),
      select: { id: true },
    });
    if (!project) return null;
    const created = await prisma.continuityNote.create({
      data: { ...input, videoProjectId: project.id },
    });
    return mapNote(created);
  },

  async update(workspaceId, projectId, noteId, input) {
    const result = await prisma.continuityNote.updateMany({
      where: {
        id: noteId,
        videoProject: visibleProject(workspaceId, projectId),
      },
      data: input,
    });
    if (result.count !== 1) return null;
    return this.find(workspaceId, projectId, noteId);
  },

  async remove(workspaceId, projectId, noteId) {
    const result = await prisma.continuityNote.deleteMany({
      where: {
        id: noteId,
        videoProject: visibleProject(workspaceId, projectId),
      },
    });
    return result.count === 1;
  },
};
