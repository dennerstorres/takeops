import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError } from "./errors.ts";
import { createProject } from "./project.ts";
import { createScene, deleteScene } from "./scene.ts";
import { createShot, getShot, listShots, type ShotDeps } from "./shot.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "shot no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("guarda o shot na cena do workspace e numera por cena", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaSceneRepository } = await import("./scene-prisma.ts");
      const { prismaShotRepository } = await import("./shot-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const deps: ShotDeps = {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        scenes: prismaSceneRepository,
        shots: prismaShotRepository,
      };
      const suffix = randomUUID();
      const author = await prisma.user.create({
        data: { email: `shot-${suffix}@example.com`, name: "Autor" },
      });
      const viewer = await prisma.user.create({
        data: { email: `shot-leitor-${suffix}@example.com`, name: "Leitor" },
      });
      const outsider = await prisma.user.create({
        data: { email: `shot-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          author.id,
          { name: `Shot ${suffix}`, slug: `shot-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Outro shot ${suffix}`, slug: `outro-shot-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        foreignId = foreign.workspace.id;
        await prisma.workspaceMember.create({
          data: { workspaceId, userId: viewer.id, role: "VIEWER" },
        });
        const project = await createProject(
          author.id,
          workspaceId,
          { title: `Peça ${suffix}`, format: "DEMO" },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
          prismaProjectRepository,
        );
        const other = await createProject(
          outsider.id,
          foreignId,
          { title: `Alheia ${suffix}`, format: "DEMO" },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
          prismaProjectRepository,
        );
        const newScene = (userId: string, wsId: string, projectId: string) =>
          createScene(
            userId,
            wsId,
            projectId,
            { title: "Demonstração", type: "PRODUCT" },
            prismaWorkspaceRepository,
            prismaProjectRepository,
            prismaSceneRepository,
          );
        const sceneA = await newScene(author.id, workspaceId, project.id);
        const sceneB = await newScene(author.id, workspaceId, project.id);
        const foreignScene = await newScene(outsider.id, foreignId, other.id);

        const first = await createShot(
          author.id,
          workspaceId,
          project.id,
          sceneA.id,
          {
            name: "Plano A",
            cameraLabel: "Frontal",
            framing: "Close",
            requiredTakes: 3,
            status: "RECORDED",
          },
          deps,
        );
        const second = await createShot(
          author.id,
          workspaceId,
          project.id,
          sceneA.id,
          { shotType: "SCREEN_CAPTURE" },
          deps,
        );
        const inB = await createShot(
          author.id,
          workspaceId,
          project.id,
          sceneB.id,
          {},
          deps,
        );
        assert.equal(first.order, 1);
        assert.equal(first.status, "PLANNED");
        assert.equal(first.requiredTakes, 3);
        assert.equal(second.order, 2);
        assert.equal(inB.order, 1);

        const listed = await listShots(
          viewer.id,
          workspaceId,
          project.id,
          sceneA.id,
          deps,
        );
        assert.deepEqual(
          listed.map((item) => item.id),
          [first.id, second.id],
        );

        await assert.rejects(
          createShot(viewer.id, workspaceId, project.id, sceneA.id, {}, deps),
          ForbiddenError,
        );
        // Cena de outro workspace não abre nem pelo id.
        await assert.rejects(
          createShot(
            author.id,
            workspaceId,
            project.id,
            foreignScene.id,
            {},
            deps,
          ),
          NotFoundError,
        );
        await assert.rejects(
          listShots(outsider.id, workspaceId, project.id, sceneA.id, deps),
          ForbiddenError,
        );
        await assert.rejects(
          getShot(
            author.id,
            workspaceId,
            project.id,
            sceneB.id,
            first.id,
            deps,
          ),
          NotFoundError,
        );

        // Cena excluída esconde os shots dela.
        await deleteScene(
          author.id,
          workspaceId,
          project.id,
          sceneA.id,
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaSceneRepository,
        );
        await assert.rejects(
          listShots(author.id, workspaceId, project.id, sceneA.id, deps),
          NotFoundError,
        );
        assert.equal(
          (
            await prismaShotRepository.list({
              workspaceId,
              projectId: project.id,
              sceneId: sceneA.id,
            })
          ).length,
          0,
        );
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        if (foreignId) {
          await prisma.workspace.deleteMany({ where: { id: foreignId } });
        }
        await prisma.user.deleteMany({
          where: { id: { in: [author.id, viewer.id, outsider.id] } },
        });
      }
    });
  },
);
