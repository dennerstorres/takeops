import { prisma } from "./db.ts";
import type {
  CharacterRecord,
  CharacterRepository,
} from "./character-repository.ts";

function mapCharacter(row: CharacterRecord): CharacterRecord {
  return {
    id: row.id,
    videoProjectId: row.videoProjectId,
    name: row.name,
    actorName: row.actorName,
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const visibleProject = (workspaceId: string, projectId: string) => ({
  id: projectId,
  workspaceId,
  deletedAt: null,
});

function isDuplicate(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export const prismaCharacterRepository: CharacterRepository = {
  async list(workspaceId, projectId) {
    const rows = await prisma.projectCharacter.findMany({
      where: { videoProject: visibleProject(workspaceId, projectId) },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
    return rows.map(mapCharacter);
  },

  async create(workspaceId, projectId, input) {
    const project = await prisma.videoProject.findFirst({
      where: visibleProject(workspaceId, projectId),
      select: { id: true },
    });
    if (!project) return null;
    try {
      const row = await prisma.projectCharacter.create({
        data: { ...input, videoProjectId: project.id },
      });
      return mapCharacter(row);
    } catch (error) {
      if (isDuplicate(error)) return "duplicate";
      throw error;
    }
  },

  async update(workspaceId, projectId, characterId, input) {
    try {
      const result = await prisma.projectCharacter.updateMany({
        where: {
          id: characterId,
          videoProject: visibleProject(workspaceId, projectId),
        },
        data: input,
      });
      if (result.count !== 1) return null;
    } catch (error) {
      if (isDuplicate(error)) return "duplicate";
      throw error;
    }
    const row = await prisma.projectCharacter.findFirst({
      where: {
        id: characterId,
        videoProject: visibleProject(workspaceId, projectId),
      },
    });
    return row ? mapCharacter(row) : null;
  },

  async delete(workspaceId, projectId, characterId) {
    const result = await prisma.projectCharacter.deleteMany({
      where: {
        id: characterId,
        videoProject: visibleProject(workspaceId, projectId),
      },
    });
    return result.count === 1;
  },

  async listLinks(workspaceId, projectId) {
    return prisma.sceneCharacter.findMany({
      where: {
        scene: {
          deletedAt: null,
          videoProject: visibleProject(workspaceId, projectId),
        },
      },
      select: { sceneId: true, characterId: true },
    });
  },

  async setSceneCharacters(workspaceId, projectId, sceneId, characterIds) {
    return prisma.$transaction(async (tx) => {
      const scene = await tx.scene.findFirst({
        where: {
          id: sceneId,
          deletedAt: null,
          videoProject: visibleProject(workspaceId, projectId),
        },
        select: { id: true, videoProjectId: true },
      });
      if (!scene) return false;
      const ids = [...new Set(characterIds)];
      const owned = await tx.projectCharacter.count({
        where: { id: { in: ids }, videoProjectId: scene.videoProjectId },
      });
      if (owned !== ids.length) return false;
      await tx.sceneCharacter.deleteMany({ where: { sceneId: scene.id } });
      if (ids.length) {
        await tx.sceneCharacter.createMany({
          data: ids.map((characterId) => ({ sceneId: scene.id, characterId })),
        });
      }
      return true;
    });
  },
};
