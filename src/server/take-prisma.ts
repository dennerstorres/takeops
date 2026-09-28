import { prisma } from "./db.ts";
import type {
  TakeRecord,
  TakeRepository,
  TakeScope,
} from "./take-repository.ts";

function mapTake(row: TakeRecord): TakeRecord {
  return {
    id: row.id,
    shotId: row.shotId,
    number: row.number,
    status: row.status,
    notes: row.notes,
    favorite: row.favorite,
    recordedById: row.recordedById,
    recordedAt: row.recordedAt,
  };
}

export const visibleShot = (scope: TakeScope) => ({
  id: scope.shotId,
  deletedAt: null,
  scene: {
    id: scope.sceneId,
    deletedAt: null,
    videoProject: {
      id: scope.projectId,
      workspaceId: scope.workspaceId,
      deletedAt: null,
    },
  },
});

export const prismaTakeRepository: TakeRepository = {
  async list(scope) {
    const rows = await prisma.take.findMany({
      where: { shot: visibleShot(scope) },
      orderBy: { number: "asc" },
    });
    return rows.map(mapTake);
  },

  async find(scope, takeId) {
    const row = await prisma.take.findFirst({
      where: { id: takeId, shot: visibleShot(scope) },
    });
    return row ? mapTake(row) : null;
  },
};
