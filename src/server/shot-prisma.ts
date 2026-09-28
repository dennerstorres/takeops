import { prisma } from "./db.ts";
import type {
  ShotRecord,
  ShotRepository,
  ShotScope,
} from "./shot-repository.ts";

function mapShot(row: ShotRecord): ShotRecord {
  return {
    id: row.id,
    sceneId: row.sceneId,
    order: row.order,
    name: row.name,
    cameraLabel: row.cameraLabel,
    shotType: row.shotType,
    framing: row.framing,
    angle: row.angle,
    subject: row.subject,
    movement: row.movement,
    description: row.description,
    requiredTakes: row.requiredTakes,
    notes: row.notes,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const visibleScene = (scope: ShotScope) => ({
  id: scope.sceneId,
  deletedAt: null,
  videoProject: {
    id: scope.projectId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  },
});

export const prismaShotRepository: ShotRepository = {
  async list(scope) {
    const rows = await prisma.shot.findMany({
      where: { deletedAt: null, scene: visibleScene(scope) },
      orderBy: { order: "asc" },
    });
    return rows.map(mapShot);
  },

  async find(scope, shotId) {
    const row = await prisma.shot.findFirst({
      where: { id: shotId, deletedAt: null, scene: visibleScene(scope) },
    });
    return row ? mapShot(row) : null;
  },

  async create(scope, input) {
    const created = await prisma.$transaction(async (tx) => {
      const scene = await tx.scene.findFirst({
        where: visibleScene(scope),
        select: { id: true },
      });
      if (!scene) return null;
      const last = await tx.shot.aggregate({
        where: { sceneId: scene.id },
        _max: { order: true },
      });
      return tx.shot.create({
        data: {
          ...input,
          sceneId: scene.id,
          order: (last._max.order ?? 0) + 1,
        },
      });
    });
    return created ? mapShot(created) : null;
  },

  async update(scope, shotId, input) {
    const updated = await prisma.$transaction(async (tx) => {
      const scene = await tx.scene.findFirst({
        where: visibleScene(scope),
        select: { id: true },
      });
      if (!scene) return null;
      const result = await tx.shot.updateMany({
        where: { id: shotId, sceneId: scene.id, deletedAt: null },
        data: input,
      });
      if (result.count !== 1) return null;
      return tx.shot.findFirst({
        where: { id: shotId, sceneId: scene.id, deletedAt: null },
      });
    });
    return updated ? mapShot(updated) : null;
  },

  async softDelete(scope, shotId, deletedAt) {
    const scene = await prisma.scene.findFirst({
      where: visibleScene(scope),
      select: { id: true },
    });
    if (!scene) return false;
    const result = await prisma.shot.updateMany({
      where: { id: shotId, sceneId: scene.id, deletedAt: null },
      data: { deletedAt },
    });
    return result.count === 1;
  },

  async reorder(scope, orderedIds) {
    const rows = await prisma.$transaction(async (tx) => {
      const scene = await tx.scene.findFirst({
        where: visibleScene(scope),
        select: { id: true },
      });
      if (!scene) return null;
      const existing = await tx.shot.findMany({
        where: { sceneId: scene.id },
        orderBy: { order: "asc" },
      });
      const visible = existing.filter((row) => row.deletedAt == null);
      const visibleIds = new Set(visible.map((row) => row.id));
      if (
        orderedIds.length !== visible.length ||
        new Set(orderedIds).size !== orderedIds.length ||
        orderedIds.some((id) => !visibleIds.has(id))
      ) {
        return null;
      }
      // Excluídos vão para o fim. Passar tudo por ordem negativa evita
      // bater no índice único (sceneId, order) no meio da troca.
      const deleted = existing.filter((row) => row.deletedAt != null);
      const final = [...orderedIds, ...deleted.map((row) => row.id)];
      for (let index = 0; index < final.length; index += 1) {
        await tx.shot.update({
          where: { id: final[index] },
          data: { order: -(index + 1) },
        });
      }
      for (let index = 0; index < final.length; index += 1) {
        await tx.shot.update({
          where: { id: final[index] },
          data: { order: index + 1 },
        });
      }
      return tx.shot.findMany({
        where: { sceneId: scene.id, deletedAt: null },
        orderBy: { order: "asc" },
      });
    });
    return rows ? rows.map(mapShot) : null;
  },
};
