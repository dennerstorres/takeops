import { prisma } from "./db.ts";
import type {
  ChecklistRepository,
  ChecklistTemplateRecord,
} from "./checklist-repository.ts";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const include = { items: { orderBy: { order: "asc" as const } } };

function mapTemplate(row: ChecklistTemplateRecord): ChecklistTemplateRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    type: row.type,
    createdAt: row.createdAt,
    items: row.items.map((item) => ({
      id: item.id,
      checklistTemplateId: item.checklistTemplateId,
      order: item.order,
      text: item.text,
    })),
  };
}

async function load(tx: Tx, workspaceId: string, templateId: string) {
  const row = await tx.checklistTemplate.findFirst({
    where: { id: templateId, workspaceId },
    include,
  });
  return row ? mapTemplate(row) : null;
}

// Grava a ordem 1..n na sequência pedida. Passa antes por ordem negativa
// para não bater no índice único (checklistTemplateId, order).
async function renumber(tx: Tx, ids: readonly string[]) {
  for (let index = 0; index < ids.length; index += 1) {
    await tx.checklistTemplateItem.update({
      where: { id: ids[index] },
      data: { order: -(index + 1) },
    });
  }
  for (let index = 0; index < ids.length; index += 1) {
    await tx.checklistTemplateItem.update({
      where: { id: ids[index] },
      data: { order: index + 1 },
    });
  }
}

export const prismaChecklistRepository: ChecklistRepository = {
  async list(workspaceId) {
    const rows = await prisma.checklistTemplate.findMany({
      where: { workspaceId },
      include,
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    return rows.map(mapTemplate);
  },

  async find(workspaceId, templateId) {
    return load(prisma as unknown as Tx, workspaceId, templateId);
  },

  async create(workspaceId, input, items) {
    const row = await prisma.checklistTemplate.create({
      data: {
        ...input,
        workspaceId,
        items: {
          create: items.map((text, index) => ({ text, order: index + 1 })),
        },
      },
      include,
    });
    return mapTemplate(row);
  },

  async update(workspaceId, templateId, input) {
    const result = await prisma.checklistTemplate.updateMany({
      where: { id: templateId, workspaceId },
      data: input,
    });
    if (result.count !== 1) return null;
    return this.find(workspaceId, templateId);
  },

  async remove(workspaceId, templateId) {
    const result = await prisma.checklistTemplate.deleteMany({
      where: { id: templateId, workspaceId },
    });
    return result.count === 1;
  },

  async addItem(workspaceId, templateId, text) {
    return prisma.$transaction(async (tx) => {
      const template = await load(tx, workspaceId, templateId);
      if (!template) return null;
      const last = template.items.at(-1)?.order ?? 0;
      await tx.checklistTemplateItem.create({
        data: { checklistTemplateId: template.id, text, order: last + 1 },
      });
      return load(tx, workspaceId, templateId);
    });
  },

  async updateItem(workspaceId, templateId, itemId, text) {
    return prisma.$transaction(async (tx) => {
      const template = await load(tx, workspaceId, templateId);
      if (!template?.items.some((item) => item.id === itemId)) return null;
      await tx.checklistTemplateItem.update({
        where: { id: itemId },
        data: { text },
      });
      return load(tx, workspaceId, templateId);
    });
  },

  async removeItem(workspaceId, templateId, itemId) {
    return prisma.$transaction(async (tx) => {
      const template = await load(tx, workspaceId, templateId);
      if (!template?.items.some((item) => item.id === itemId)) return null;
      await tx.checklistTemplateItem.delete({ where: { id: itemId } });
      await renumber(
        tx,
        template.items
          .filter((item) => item.id !== itemId)
          .map((item) => item.id),
      );
      return load(tx, workspaceId, templateId);
    });
  },

  async reorderItems(workspaceId, templateId, orderedIds) {
    return prisma.$transaction(async (tx) => {
      const template = await load(tx, workspaceId, templateId);
      if (!template) return null;
      const known = new Set(template.items.map((item) => item.id));
      if (
        orderedIds.length !== template.items.length ||
        new Set(orderedIds).size !== orderedIds.length ||
        orderedIds.some((id) => !known.has(id))
      ) {
        return null;
      }
      await renumber(tx, orderedIds);
      return load(tx, workspaceId, templateId);
    });
  },
};
