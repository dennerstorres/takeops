import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError } from "./errors.ts";
import { createProject } from "./project.ts";
import { createScene } from "./scene.ts";
import { importScript } from "./script-import.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

const file = [
  "# Horta",
  "**Notas:** Luz natural.",
  "# Direção",
  "Sem pressa.",
  "# Cena 1 — Vasos",
  "**Tipo:** Gancho",
  "**Duração:** 15",
  "**APRESENTADORA:**",
  "Dá pra ter tempero sem quintal.",
  "## Plano 1.1 — Mudas",
  "**Tipo:** Inserto",
  "**Takes:** 2",
  "## Plano 1.2 — Vasos",
  "# Cena 2 — Rega",
].join("\n");

describe(
  "importação de roteiro no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("acrescenta cenas e planos numa transação, isolada por workspace", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaActivityRepository } = await import("./activity-prisma.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaSceneRepository } = await import("./scene-prisma.ts");
      const { prismaScriptImportRepository } =
        await import("./script-import-prisma.ts");
      const { prismaScriptRepository } = await import("./script-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const deps = {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        scenes: prismaSceneRepository,
        scripts: prismaScriptRepository,
        imports: prismaScriptImportRepository,
        activities: prismaActivityRepository,
      };
      const suffix = randomUUID();
      const author = await prisma.user.create({
        data: { email: `importa-${suffix}@example.com`, name: "Autora" },
      });
      const outsider = await prisma.user.create({
        data: { email: `importa-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          author.id,
          { name: `Importa ${suffix}`, slug: `importa-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Outro ${suffix}`, slug: `importa-outro-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        foreignId = foreign.workspace.id;
        const project = await createProject(
          author.id,
          workspaceId,
          { title: `Horta ${suffix}`, format: "TUTORIAL" },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
          prismaProjectRepository,
        );
        const first = await createScene(
          author.id,
          workspaceId,
          project.id,
          { title: "Já existia", type: "OTHER" },
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaSceneRepository,
        );

        const result = await importScript(
          author.id,
          workspaceId,
          project.id,
          file,
          { appendToExisting: true },
          deps,
        );
        assert.equal(result.sceneIds.length, 2);
        assert.equal(result.shots, 2);

        const scenes = await prisma.scene.findMany({
          where: { videoProjectId: project.id },
          orderBy: { order: "asc" },
          include: { shots: { orderBy: { order: "asc" } } },
        });
        assert.deepEqual(
          scenes.map((scene) => [
            scene.order,
            scene.title,
            scene.type,
            scene.shots.map((shot) => [
              shot.order,
              shot.name,
              shot.requiredTakes,
            ]),
          ]),
          [
            [first.order, "Já existia", "OTHER", []],
            [
              first.order + 1,
              "Vasos",
              "HOOK",
              [
                [1, "Mudas", 2],
                [2, "Vasos", 1],
              ],
            ],
            [first.order + 2, "Rega", "OTHER", []],
          ],
        );
        assert.equal(
          scenes[1].dialogue,
          "APRESENTADORA: Dá pra ter tempero sem quintal.",
        );
        const script = await prisma.script.findUnique({
          where: { videoProjectId: project.id },
        });
        assert.equal(script?.notes, "Luz natural.\n\nDireção\nSem pressa.");
        const activity = await prisma.activityLog.findFirst({
          where: { videoProjectId: project.id, action: "SCRIPT_IMPORTED" },
        });
        assert.deepEqual(activity?.metadata, { scenes: 2, shots: 2 });

        await assert.rejects(
          () =>
            importScript(
              outsider.id,
              workspaceId,
              project.id,
              file,
              { appendToExisting: true },
              deps,
            ),
          ForbiddenError,
        );
        await assert.rejects(
          () =>
            importScript(
              outsider.id,
              foreignId,
              project.id,
              file,
              { appendToExisting: true },
              deps,
            ),
          NotFoundError,
        );
        assert.equal(
          await prisma.scene.count({ where: { videoProjectId: project.id } }),
          3,
        );
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        if (foreignId) {
          await prisma.workspace.deleteMany({ where: { id: foreignId } });
        }
        await prisma.user.deleteMany({
          where: { id: { in: [author.id, outsider.id] } },
        });
      }
    });
  },
);
