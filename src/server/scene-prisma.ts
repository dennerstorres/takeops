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
      where: { videoProject: visibleProject(workspaceId, projectId) },
      orderBy: { order: "asc" },
    });
    return rows.map(mapScene);
  },

  async find(workspaceId, projectId, sceneId) {
    const row = await prisma.scene.findFirst({
      where: {
        id: sceneId,
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
};
