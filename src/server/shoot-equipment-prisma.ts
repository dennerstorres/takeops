import type { Prisma } from "../generated/prisma/client.ts";
import { prisma } from "./db.ts";
import type {
  ShootEquipmentRecord,
  ShootEquipmentRepository,
  ShootEquipmentScope,
} from "./shoot-equipment-repository.ts";

const include = {
  equipmentItem: { select: { name: true, category: true, active: true } },
} as const;

type Row = Prisma.ShootEquipmentGetPayload<{ include: typeof include }>;

function mapRow(row: Row): ShootEquipmentRecord {
  return {
    id: row.id,
    shootId: row.shootId,
    equipmentItemId: row.equipmentItemId,
    required: row.required,
    checked: row.checked,
    notes: row.notes,
    item: {
      name: row.equipmentItem.name,
      category: row.equipmentItem.category,
      active: row.equipmentItem.active,
    },
  };
}

const visibleShoot = (scope: ShootEquipmentScope) => ({
  id: scope.shootId,
  deletedAt: null,
  videoProject: {
    id: scope.projectId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  },
});

export const prismaShootEquipmentRepository: ShootEquipmentRepository = {
  async list(scope) {
    const rows = await prisma.shootEquipment.findMany({
      where: { shoot: visibleShoot(scope) },
      include,
      orderBy: [{ equipmentItem: { category: "asc" } }, { createdAt: "asc" }],
    });
    return rows.map(mapRow);
  },

  async add(scope, input) {
    const shoot = await prisma.shoot.findFirst({
      where: visibleShoot(scope),
      select: { id: true },
    });
    if (!shoot) return null;
    // O item precisa ser do mesmo workspace e estar em uso.
    const item = await prisma.equipmentItem.findFirst({
      where: {
        id: input.equipmentItemId,
        workspaceId: scope.workspaceId,
        active: true,
      },
      select: { id: true },
    });
    if (!item) return null;
    try {
      const row = await prisma.shootEquipment.create({
        data: {
          shootId: shoot.id,
          equipmentItemId: item.id,
          required: input.required,
          notes: input.notes,
        },
        include,
      });
      return mapRow(row);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        return "duplicate";
      }
      throw error;
    }
  },

  async update(scope, rowId, input) {
    const result = await prisma.shootEquipment.updateMany({
      where: { id: rowId, shoot: visibleShoot(scope) },
      data: input,
    });
    if (result.count !== 1) return null;
    const row = await prisma.shootEquipment.findFirst({
      where: { id: rowId, shoot: visibleShoot(scope) },
      include,
    });
    return row ? mapRow(row) : null;
  },

  async remove(scope, rowId) {
    const result = await prisma.shootEquipment.deleteMany({
      where: { id: rowId, shoot: visibleShoot(scope) },
    });
    return result.count === 1;
  },
};
