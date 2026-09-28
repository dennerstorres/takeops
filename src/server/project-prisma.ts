import { prisma } from "./db.ts";
import type { IdeaFormat } from "./idea-labels.ts";
import type {
  AspectRatio,
  ProjectPriority,
  VideoProjectStatus,
} from "./project-labels.ts";
import type { ProjectRecord, ProjectRepository } from "./project-repository.ts";

function mapProject(row: {
  id: string;
  workspaceId: string;
  title: string;
  slug: string | null;
  description: string | null;
  objective: string | null;
  audience: string | null;
  product: string | null;
  format: IdeaFormat;
  aspectRatio: AspectRatio;
  estimatedDurationSeconds: number | null;
  status: VideoProjectStatus;
  priority: ProjectPriority;
  thumbnailUrl: string | null;
  ownerId: string | null;
  plannedShootDate: Date | null;
  plannedPublishDate: Date | null;
  sourceIdeaId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}): ProjectRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    title: row.title,
    slug: row.slug,
    description: row.description,
    objective: row.objective,
    audience: row.audience,
    product: row.product,
    format: row.format,
    aspectRatio: row.aspectRatio,
    estimatedDurationSeconds: row.estimatedDurationSeconds,
    status: row.status,
    priority: row.priority,
    thumbnailUrl: row.thumbnailUrl,
    ownerId: row.ownerId,
    plannedShootDate: row.plannedShootDate,
    plannedPublishDate: row.plannedPublishDate,
    sourceIdeaId: row.sourceIdeaId,
    createdById: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const prismaProjectRepository: ProjectRepository = {
  async list(workspaceId) {
    const rows = await prisma.videoProject.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapProject);
  },

  async find(workspaceId, projectId) {
    const project = await prisma.videoProject.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
    });
    return project ? mapProject(project) : null;
  },

  async findBySlug(workspaceId, slug) {
    const project = await prisma.videoProject.findFirst({
      where: { workspaceId, slug },
    });
    return project ? mapProject(project) : null;
  },

  async create(workspaceId, createdById, input) {
    const project = await prisma.videoProject.create({
      data: { ...input, workspaceId, createdById },
    });
    return mapProject(project);
  },
};
