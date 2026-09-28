import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { createProject } from "./project.ts";
import { createScene, deleteScene, getScene, listScenes, updateScene } from "./scene.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "cena no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("guarda a cena na produção do workspace e numera a ordem", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaSceneRepository } = await import("./scene-prisma.ts");
      const { prismaWorkspaceRepository } = await import("./workspace-prisma.ts");
      const suffix = randomUUID();
      const author = await prisma.user.create({
        data: { email: `cena-${suffix}@example.com`, name: "Autor" },
      });
      const speaker = await prisma.user.create({
        data: { email: `cena-fala-${suffix}@example.com`, name: "Fala" },
      });
      const viewer = await prisma.user.create({
        data: { email: `cena-leitor-${suffix}@example.com`, name: "Leitor" },
      });
      const outsider = await prisma.user.create({
        data: { email: `cena-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          author.id,
          { name: `Cena ${suffix}`, slug: `cena-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Outra cena ${suffix}`, slug: `outra-cena-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        foreignId = foreign.workspace.id;
        await prisma.workspaceMember.createMany({
          data: [
            { workspaceId, userId: speaker.id, role: "MEMBER" },
            { workspaceId, userId: viewer.id, role: "VIEWER" },
          ],
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
        const first = await createScene(
          author.id,
          workspaceId,
          project.id,
          {
            title: "Abertura",
            type: "HOOK",
            speakerId: speaker.id,
            dialogue: "Olá",
            status: "READY",
            order: 8,
          },
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaSceneRepository,
        );
        const second = await createScene(
          author.id,
          workspaceId,
          project.id,
          { title: "Produto", type: "PRODUCT", estimatedDurationSeconds: 12 },
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaSceneRepository,
        );
        assert.equal(first.status, "PLANNED");
        assert.equal(first.order, 1);
        assert.equal(first.speakerId, speaker.id);
        assert.equal(second.order, 2);
        assert.equal(second.estimatedDurationSeconds, 12);

        const listed = await listScenes(
          viewer.id,
          workspaceId,
          project.id,
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaSceneRepository,
        );
        assert.deepEqual(
          listed.map((item) => item.order),
          [1, 2],
        );
        await assert.rejects(
          () =>
            createScene(
              viewer.id,
              workspaceId,
              project.id,
              { title: "Não", type: "OTHER" },
              prismaWorkspaceRepository,
              prismaProjectRepository,
              prismaSceneRepository,
            ),
          ForbiddenError,
        );
        await assert.rejects(
          () =>
            createScene(
              author.id,
              workspaceId,
              project.id,
              { title: "Fora", type: "OTHER", speakerId: outsider.id },
              prismaWorkspaceRepository,
              prismaProjectRepository,
              prismaSceneRepository,
            ),
          (error: unknown) =>
            error instanceof ValidationError && error.fields.speakerId !== undefined,
        );
        await assert.rejects(
          () =>
            createScene(
              author.id,
              workspaceId,
              other.id,
              { title: "Cruzada", type: "OTHER" },
              prismaWorkspaceRepository,
              prismaProjectRepository,
              prismaSceneRepository,
            ),
          NotFoundError,
        );
        assert.equal(
          await prisma.scene.count({ where: { videoProjectId: other.id } }),
          0,
        );
        const edited = await updateScene(
          author.id,
          workspaceId,
          project.id,
          first.id,
          { title: "Abertura nova", type: "DIALOGUE", status: "READY", order: 9 },
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaSceneRepository,
        );
        assert.equal(edited.title, "Abertura nova");
        assert.equal(edited.status, "READY");
        assert.equal(edited.order, 1);
        await deleteScene(
          author.id,
          workspaceId,
          project.id,
          second.id,
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaSceneRepository,
        );
        const afterDelete = await listScenes(
          author.id,
          workspaceId,
          project.id,
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaSceneRepository,
        );
        assert.deepEqual(
          afterDelete.map((item) => item.id),
          [first.id],
        );
        const hidden = await prisma.scene.findFirst({ where: { id: second.id } });
        assert.ok(hidden?.deletedAt);
        await assert.rejects(
          () =>
            getScene(
              author.id,
              workspaceId,
              project.id,
              second.id,
              prismaWorkspaceRepository,
              prismaProjectRepository,
              prismaSceneRepository,
            ),
          NotFoundError,
        );
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        if (foreignId) {
          await prisma.workspace.deleteMany({ where: { id: foreignId } });
        }
        await prisma.user.deleteMany({
          where: { id: { in: [author.id, speaker.id, viewer.id, outsider.id] } },
        });
      }
    });
  },
);
