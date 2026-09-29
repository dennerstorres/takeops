import { prisma } from "./db.ts";
import type { AssetRecord, AssetRepository } from "./asset-repository.ts";

function mapAsset(row: AssetRecord): AssetRecord {
  return {
    id: row.id,
    videoProjectId: row.videoProjectId,
    type: row.type,
    title: row.title,
    url: row.url,
    description: row.description,
    createdById: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const visibleProject = (workspaceId: string, projectId: string) => ({
  id: projectId,
  workspaceId,
  deletedAt: null,
});

export const prismaAssetRepository: AssetRepository = {
  async list(workspaceId, projectId) {
    const rows = await prisma.asset.findMany({
      where: { videoProject: visibleProject(workspaceId, projectId) },
      orderBy: [{ type: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(mapAsset);
  },

  async create(workspaceId, projectId, input) {
    const project = await prisma.videoProject.findFirst({
      where: visibleProject(workspaceId, projectId),
      select: { id: true },
    });
    if (!project) return null;
    const created = await prisma.asset.create({
      data: { ...input, videoProjectId: project.id },
    });
    return mapAsset(created);
  },

  async update(workspaceId, projectId, assetId, input) {
    const result = await prisma.asset.updateMany({
      where: {
        id: assetId,
        videoProject: visibleProject(workspaceId, projectId),
      },
      data: input,
    });
    if (result.count !== 1) return null;
    const row = await prisma.asset.findFirst({
      where: {
        id: assetId,
        videoProject: visibleProject(workspaceId, projectId),
      },
    });
    return row ? mapAsset(row) : null;
  },

  async remove(workspaceId, projectId, assetId) {
    const result = await prisma.asset.deleteMany({
      where: {
        id: assetId,
        videoProject: visibleProject(workspaceId, projectId),
      },
    });
    return result.count === 1;
  },
};
