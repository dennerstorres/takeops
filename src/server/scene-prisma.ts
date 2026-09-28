import { prisma } from "./db.ts";
import type { SceneRecord, SceneRepository } from "./scene-repository.ts";

function mapScene(row: SceneRecord): SceneRecord {
  return {
    id: row.id,
    videoProjectId: row.videoProjectId,
    order: row.order,
    title: row.title,
    description: row.description,
    type: row.type,
    speakerId: row.speakerId,
    dialogue: row.dialogue,
    action: row.action,
    estimatedDurationSeconds: row.estimatedDurationSeconds,
    cameraInstructions: row.cameraInstructions,
    editingInstructions: row.editingInstructions,
    continuityNotes: row.continuityNotes,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const visibleProject = (workspaceId: string, projectId: string) => ({
  id: projectId,
  workspaceId,
  deletedAt: null,
});

export const prismaSceneRepository: SceneRepository = {
  async list(workspaceId, projectId) {
    const rows = await prisma.scene.findMany({
      where: {
        deletedAt: null,
        videoProject: visibleProject(workspaceId, projectId),
      },
      orderBy: { order: "asc" },
    });
    return rows.map(mapScene);
  },

  async find(workspaceId, projectId, sceneId) {
    const row = await prisma.scene.findFirst({
      where: {
        id: sceneId,
        deletedAt: null,
        videoProject: visibleProject(workspaceId, projectId),
      },
    });
    return row ? mapScene(row) : null;
  },

  async create(workspaceId, projectId, input) {
    const created = await prisma.$transaction(async (tx) => {
      const project = await tx.videoProject.findFirst({
        where: visibleProject(workspaceId, projectId),
        select: { id: true },
      });
      if (!project) return null;
      const last = await tx.scene.aggregate({
        where: { videoProjectId: project.id },
        _max: { order: true },
      });
      return tx.scene.create({
        data: {
          ...input,
          videoProjectId: project.id,
          order: (last._max.order ?? 0) + 1,
        },
      });
    });
    return created ? mapScene(created) : null;
  },

  async update(workspaceId, projectId, sceneId, input) {
    const updated = await prisma.$transaction(async (tx) => {
      const project = await tx.videoProject.findFirst({
        where: visibleProject(workspaceId, projectId),
        select: { id: true },
      });
      if (!project) return null;
      const result = await tx.scene.updateMany({
        where: {
          id: sceneId,
          videoProjectId: project.id,
          deletedAt: null,
        },
        data: input,
      });
      if (result.count !== 1) return null;
      return tx.scene.findFirst({
        where: { id: sceneId, videoProjectId: project.id, deletedAt: null },
      });
    });
    return updated ? mapScene(updated) : null;
  },

  async softDelete(workspaceId, projectId, sceneId, deletedAt) {
    const project = await prisma.videoProject.findFirst({
      where: visibleProject(workspaceId, projectId),
      select: { id: true },
    });
    if (!project) return false;
    const result = await prisma.scene.updateMany({
      where: { id: sceneId, videoProjectId: project.id, deletedAt: null },
      data: { deletedAt },
    });
    return result.count === 1;
  },
};
