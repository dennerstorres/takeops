import { prisma } from "./db.ts";
import type { ScriptRecord, ScriptRepository } from "./script-repository.ts";

function mapScript(row: ScriptRecord): ScriptRecord {
  return {
    id: row.id,
    videoProjectId: row.videoProjectId,
    hook: row.hook,
    mainMessage: row.mainMessage,
    cta: row.cta,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const prismaScriptRepository: ScriptRepository = {
  async find(workspaceId, projectId) {
    const row = await prisma.script.findFirst({
      where: {
        videoProjectId: projectId,
        videoProject: { workspaceId, deletedAt: null },
      },
    });
    return row ? mapScript(row) : null;
  },

  async save(workspaceId, projectId, input) {
    const saved = await prisma.$transaction(async (tx) => {
      const project = await tx.videoProject.findFirst({
        where: { id: projectId, workspaceId, deletedAt: null },
        select: { id: true },
      });
      if (!project) return null;
      return tx.script.upsert({
        where: { videoProjectId: project.id },
        create: { videoProjectId: project.id, ...input },
        update: input,
      });
    });
    return saved ? mapScript(saved) : null;
  },
};
