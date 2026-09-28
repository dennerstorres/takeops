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

  async create(scope, input) {
    // Duas pessoas registrando ao mesmo tempo podem pegar o mesmo número.
    // O índice único recusa a segunda; ela tenta de novo com o próximo.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const created = await prisma.$transaction(async (tx) => {
          const shot = await tx.shot.findFirst({
            where: visibleShot(scope),
            select: { id: true },
          });
          if (!shot) return null;
          const last = await tx.take.aggregate({
            where: { shotId: shot.id },
            _max: { number: true },
          });
          return tx.take.create({
            data: {
              ...input,
              shotId: shot.id,
              number: (last._max.number ?? 0) + 1,
            },
          });
        });
        return created ? mapTake(created) : null;
      } catch (error) {
        const duplicate =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002";
        if (!duplicate || attempt === 2) throw error;
      }
    }
    return null;
  },

  async update(scope, takeId, input) {
    const result = await prisma.take.updateMany({
      where: { id: takeId, shot: visibleShot(scope) },
      // Take que deixa de ser OK não pode continuar preferido.
      data: input.status === "OK" ? input : { ...input, favorite: false },
    });
    if (result.count !== 1) return null;
    return this.find(scope, takeId);
  },
};
