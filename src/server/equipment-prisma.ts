import { prisma } from "./db.ts";
import type {
  EquipmentRecord,
  EquipmentRepository,
} from "./equipment-repository.ts";

function mapItem(row: EquipmentRecord): EquipmentRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    category: row.category,
    notes: row.notes,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const prismaEquipmentRepository: EquipmentRepository = {
  async list(workspaceId) {
    const rows = await prisma.equipmentItem.findMany({
      where: { workspaceId },
      orderBy: [{ active: "desc" }, { category: "asc" }, { name: "asc" }],
    });
    return rows.map(mapItem);
  },

  async find(workspaceId, itemId) {
    const row = await prisma.equipmentItem.findFirst({
      where: { id: itemId, workspaceId },
    });
    return row ? mapItem(row) : null;
  },

  async create(workspaceId, input) {
    const row = await prisma.equipmentItem.create({
      data: { ...input, workspaceId },
    });
    return mapItem(row);
  },

  async update(workspaceId, itemId, input) {
    const result = await prisma.equipmentItem.updateMany({
      where: { id: itemId, workspaceId },
      data: input,
    });
    if (result.count !== 1) return null;
    return this.find(workspaceId, itemId);
  },
};
