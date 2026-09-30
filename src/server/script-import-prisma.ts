import { prisma } from "./db.ts";
import type { ScriptImportRepository } from "./script-import-repository.ts";

// Roteiro grande são centenas de inserts em sequência; o limite padrão de
// 5 s da transação não cobre um banco remoto.
export const prismaScriptImportRepository: ScriptImportRepository = {
  async importScript(workspaceId, projectId, input) {
    return prisma.$transaction(
      async (tx) => {
        const project = await tx.videoProject.findFirst({
          where: { id: projectId, workspaceId, deletedAt: null },
          select: { id: true },
        });
        if (!project) return null;
        await tx.script.upsert({
          where: { videoProjectId: project.id },
          create: { videoProjectId: project.id, ...input.script },
          update: input.script,
        });
        if (input.characters.length) {
          await tx.projectCharacter.createMany({
            data: input.characters.map((name) => ({
              name,
              videoProjectId: project.id,
            })),
            skipDuplicates: true,
          });
        }
        const characters = await tx.projectCharacter.findMany({
          where: { videoProjectId: project.id },
          select: { id: true, name: true },
        });
        const characterIds = new Map(
          characters.map((row) => [row.name, row.id]),
        );
        // A ordem é única por produção contando cenas apagadas; segue o
        // mesmo máximo que a criação de uma cena usa.
        const last = await tx.scene.aggregate({
          where: { videoProjectId: project.id },
          _max: { order: true },
        });
        let order = last._max.order ?? 0;
        const sceneIds: string[] = [];
        let shots = 0;
        for (const {
          shots: sceneShots,
          characterNames,
          ...scene
        } of input.scenes) {
          order += 1;
          const created = await tx.scene.create({
            data: { ...scene, videoProjectId: project.id, order },
            select: { id: true },
          });
          sceneIds.push(created.id);
          const links = characterNames
            .map((name) => characterIds.get(name))
            .filter((id): id is string => Boolean(id));
          if (links.length) {
            await tx.sceneCharacter.createMany({
              data: links.map((characterId) => ({
                sceneId: created.id,
                characterId,
              })),
              skipDuplicates: true,
            });
          }
          if (sceneShots.length) {
            await tx.shot.createMany({
              data: sceneShots.map((shot, index) => ({
                ...shot,
                sceneId: created.id,
                order: index + 1,
              })),
            });
            shots += sceneShots.length;
          }
        }
        return { sceneIds, shots };
      },
      { timeout: 30_000 },
    );
  },
};
