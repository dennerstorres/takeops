import { prisma } from "./db.ts";
import type {
  ShootChecklistItemRecord,
  ShootChecklistRepository,
  ShootChecklistScope,
} from "./shoot-checklist-repository.ts";

const include = { completedBy: { select: { name: true, email: true } } };

type Row = {
  id: string;
  shootId: string;
  text: string;
  order: number;
  completed: boolean;
  completedById: string | null;
  completedAt: Date | null;
  completedBy: { name: string | null; email: string | null } | null;
};

function mapItem(row: Row): ShootChecklistItemRecord {
  return {
    id: row.id,
    shootId: row.shootId,
    text: row.text,
    order: row.order,
    completed: row.completed,
    completedById: row.completedById,
    completedByName: row.completedBy
      ? row.completedBy.name || row.completedBy.email
      : null,
    completedAt: row.completedAt,
  };
}

const visibleShoot = (scope: ShootChecklistScope) => ({
  id: scope.shootId,
  deletedAt: null,
  videoProject: {
    id: scope.projectId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  },
});

export const prismaShootChecklistRepository: ShootChecklistRepository = {
  async list(scope) {
    const rows = await prisma.shootChecklistItem.findMany({
      where: { shoot: visibleShoot(scope) },
      include,
      orderBy: { order: "asc" },
    });
    return rows.map(mapItem);
  },

  async copyFromTemplate(scope, templateId) {
    return prisma.$transaction(async (tx) => {
      const shoot = await tx.shoot.findFirst({
        where: visibleShoot(scope),
        select: { id: true },
      });
      if (!shoot) return null;
      const template = await tx.checklistTemplate.findFirst({
        where: { id: templateId, workspaceId: scope.workspaceId },
        include: { items: { orderBy: { order: "asc" } } },
      });
      if (!template) return null;
      const last = await tx.shootChecklistItem.aggregate({
        where: { shootId: shoot.id },
        _max: { order: true },
      });
      const start = last._max.order ?? 0;
      // Copia o texto, não liga ao modelo: mudar o modelo depois não mexe aqui.
      await tx.shootChecklistItem.createMany({
        data: template.items.map((item, index) => ({
          shootId: shoot.id,
          text: item.text,
          order: start + index + 1,
        })),
      });
      const rows = await tx.shootChecklistItem.findMany({
        where: { shootId: shoot.id },
        include,
        orderBy: { order: "asc" },
      });
      return rows.map(mapItem);
    });
  },

  async setCompleted(scope, itemId, completion) {
    const result = await prisma.shootChecklistItem.updateMany({
      where: { id: itemId, shoot: visibleShoot(scope) },
      data: completion
        ? {
            completed: true,
            completedById: completion.userId,
            completedAt: completion.at,
          }
        : { completed: false, completedById: null, completedAt: null },
    });
    if (result.count !== 1) return null;
    const row = await prisma.shootChecklistItem.findFirst({
      where: { id: itemId, shoot: visibleShoot(scope) },
      include,
    });
    return row ? mapItem(row) : null;
  },
};
