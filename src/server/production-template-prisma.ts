import { prisma } from "./db.ts";
import type {
  ProductionTemplateRecord,
  ProductionTemplateRepository,
} from "./production-template-repository.ts";

function mapTemplate(row: ProductionTemplateRecord): ProductionTemplateRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    description: row.description,
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
  };
