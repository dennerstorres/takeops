import { prisma } from "./db.ts";
import type { IdeaFormat, IdeaStatus } from "./idea-labels.ts";
import type { IdeaRecord, IdeaRepository } from "./idea-repository.ts";

function mapIdea(row: {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  format: IdeaFormat | null;
  objective: string | null;
  product: string | null;
  audience: string | null;
  referenceUrl: string | null;
  notes: string | null;
  authorId: string;
  status: IdeaStatus;
  createdAt: Date;
  updatedAt: Date;
  author: { name: string | null };
}): IdeaRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    title: row.title,
    description: row.description,
    format: row.format,
    objective: row.objective,
    product: row.product,
    audience: row.audience,
    referenceUrl: row.referenceUrl,
    notes: row.notes,
    authorId: row.authorId,
    authorName: row.author.name,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const includeAuthor = { author: { select: { name: true } } } as const;

export const prismaIdeaRepository: IdeaRepository = {
  async list(workspaceId) {
    const rows = await prisma.idea.findMany({
      where: { workspaceId, deletedAt: null },
      include: includeAuthor,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapIdea);
  },

  async find(workspaceId, ideaId) {
    const idea = await prisma.idea.findFirst({
      where: { id: ideaId, workspaceId, deletedAt: null },
      include: includeAuthor,
    });
    return idea ? mapIdea(idea) : null;
  },

  async create(workspaceId, authorId, input) {
    const idea = await prisma.idea.create({
      data: { ...input, workspaceId, authorId },
      include: includeAuthor,
    });
    return mapIdea(idea);
  },

  async update(workspaceId, ideaId, input) {
    const updated = await prisma.idea.updateMany({
      where: { id: ideaId, workspaceId, deletedAt: null },
      data: input,
    });
    if (updated.count !== 1) return null;
    return this.find(workspaceId, ideaId);
  },

  async setStatus(workspaceId, ideaId, status) {
    const updated = await prisma.idea.updateMany({
      where: { id: ideaId, workspaceId, deletedAt: null },
      data: { status },
    });
    if (updated.count !== 1) return null;
    return this.find(workspaceId, ideaId);
  },

  async softDelete(workspaceId, ideaId, deletedAt) {
    const updated = await prisma.idea.updateMany({
      where: { id: ideaId, workspaceId, deletedAt: null },
      data: { deletedAt },
    });
    return updated.count === 1;
  },
};
