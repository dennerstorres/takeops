import { prisma } from "./db.ts";
import type {
  EditingInfoRecord,
  EditingRepository,
} from "./editing-repository.ts";

function mapInfo(row: EditingInfoRecord): EditingInfoRecord {
  return {
    id: row.id,
    videoProjectId: row.videoProjectId,
    editorId: row.editorId,
    software: row.software,
    projectFileUrl: row.projectFileUrl,
    notes: row.notes,
    targetResolution: row.targetResolution,
    targetFps: row.targetFps,
    aspectRatio: row.aspectRatio,
    captionsRequired: row.captionsRequired,
    musicRequired: row.musicRequired,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const visibleProject = (workspaceId: string, projectId: string) => ({
  id: projectId,
  workspaceId,
  deletedAt: null,
});

export const prismaEditingRepository: EditingRepository = {
  async find(workspaceId, projectId) {
    const row = await prisma.editingInfo.findFirst({
      where: { videoProject: visibleProject(workspaceId, projectId) },
    });
    return row ? mapInfo(row) : null;
  },

  async save(workspaceId, projectId, input) {
    const project = await prisma.videoProject.findFirst({
      where: visibleProject(workspaceId, projectId),
      select: { id: true },
    });
    if (!project) return null;
    // O índice único por produção faz o upsert não duplicar em dois
    // salvamentos simultâneos.
    const row = await prisma.editingInfo.upsert({
      where: { videoProjectId: project.id },
      create: { ...input, videoProjectId: project.id },
      update: input,
    });
    return mapInfo(row);
  },
};
