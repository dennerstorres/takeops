import { prisma } from "./db.ts";
import type {
  ProductionTemplateRecord,
  ProductionTemplateRepository,
  TemplateSceneRecord,
} from "./production-template-repository.ts";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function mapScene(row: TemplateSceneRecord): TemplateSceneRecord {
  return {
    id: row.id,
    templateId: row.templateId,
    order: row.order,
    title: row.title,
    type: row.type,
    description: row.description,
  };
}

async function loadScenes(tx: Tx, workspaceId: string, templateId: string) {
  const template = await tx.productionTemplate.findFirst({
    where: { id: templateId, workspaceId },
    select: { id: true },
  });
  if (!template) return null;
  const rows = await tx.productionTemplateScene.findMany({
    where: { templateId: template.id },
    orderBy: { order: "asc" },
  });
  return rows.map(mapScene);
}

// Ordem única por template: primeiro tudo para negativo, depois 1..n, para
// não bater no índice no meio da troca.
async function renumber(tx: Tx, ids: readonly string[]) {
  for (let index = 0; index < ids.length; index += 1) {
    await tx.productionTemplateScene.update({
      where: { id: ids[index] },
      data: { order: -(index + 1) },
    });
  }
  for (let index = 0; index < ids.length; index += 1) {
    await tx.productionTemplateScene.update({
      where: { id: ids[index] },
      data: { order: index + 1 },
    });
  }
}

function mapTemplate(row: ProductionTemplateRecord): ProductionTemplateRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    description: row.description,
    checklistTemplateId: row.checklistTemplateId,
    createdById: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const prismaProductionTemplateRepository: ProductionTemplateRepository =
  {
    async list(workspaceId) {
      const rows = await prisma.productionTemplate.findMany({
        where: { workspaceId },
        orderBy: { name: "asc" },
      });
      return rows.map(mapTemplate);
    },

    async find(workspaceId, templateId) {
      const row = await prisma.productionTemplate.findFirst({
        where: { id: templateId, workspaceId },
      });
      return row ? mapTemplate(row) : null;
    },

    async create(workspaceId, input) {
      const row = await prisma.productionTemplate.create({
        data: { ...input, workspaceId },
      });
      return mapTemplate(row);
    },

    async update(workspaceId, templateId, input) {
      const result = await prisma.productionTemplate.updateMany({
        where: { id: templateId, workspaceId },
        data: input,
      });
      if (result.count !== 1) return null;
      return this.find(workspaceId, templateId);
    },

    async remove(workspaceId, templateId) {
      const result = await prisma.productionTemplate.deleteMany({
        where: { id: templateId, workspaceId },
      });
      return result.count === 1;
    },

    async listScenes(workspaceId, templateId) {
      return prisma.$transaction((tx) =>
        loadScenes(tx, workspaceId, templateId),
      );
    },

    async addScene(workspaceId, templateId, input) {
      return prisma.$transaction(async (tx) => {
        const scenes = await loadScenes(tx, workspaceId, templateId);
        if (!scenes) return null;
        await tx.productionTemplateScene.create({
          data: {
            ...input,
            templateId,
            order: (scenes.at(-1)?.order ?? 0) + 1,
          },
        });
        return loadScenes(tx, workspaceId, templateId);
      });
    },

    async removeScene(workspaceId, templateId, sceneId) {
      return prisma.$transaction(async (tx) => {
        const scenes = await loadScenes(tx, workspaceId, templateId);
        if (!scenes?.some((scene) => scene.id === sceneId)) return null;
        await tx.productionTemplateScene.delete({ where: { id: sceneId } });
        await renumber(
          tx,
          scenes
            .filter((scene) => scene.id !== sceneId)
            .map((scene) => scene.id),
        );
        return loadScenes(tx, workspaceId, templateId);
      });
    },

    async moveScene(workspaceId, templateId, sceneId, direction) {
      return prisma.$transaction(async (tx) => {
        const scenes = await loadScenes(tx, workspaceId, templateId);
        const index = scenes?.findIndex((scene) => scene.id === sceneId) ?? -1;
        if (!scenes || index < 0) return null;
        const target = direction === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= scenes.length) return scenes;
        const ids = scenes.map((scene) => scene.id);
        [ids[index], ids[target]] = [ids[target], ids[index]];
        await renumber(tx, ids);
        return loadScenes(tx, workspaceId, templateId);
      });
    },

    async setChecklist(workspaceId, templateId, checklistTemplateId) {
      return prisma.$transaction(async (tx) => {
        const template = await tx.productionTemplate.findFirst({
          where: { id: templateId, workspaceId },
          select: { id: true },
        });
        if (!template) return null;
        if (checklistTemplateId) {
          const checklist = await tx.checklistTemplate.findFirst({
            where: { id: checklistTemplateId, workspaceId },
            select: { id: true },
          });
          if (!checklist) return "invalid" as const;
        }
        const row = await tx.productionTemplate.update({
          where: { id: template.id },
          data: { checklistTemplateId },
        });
        return mapTemplate(row);
      });
    },
  };
