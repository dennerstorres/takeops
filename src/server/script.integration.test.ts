import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError } from "./errors.ts";
import { createProject } from "./project.ts";
import { getScript, saveScript } from "./script.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "roteiro no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("isola o roteiro da produção e atualiza o mesmo registro", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaScriptRepository } = await import("./script-prisma.ts");
      const { prismaWorkspaceRepository } = await import("./workspace-prisma.ts");
      const suffix = randomUUID();
      const author = await prisma.user.create({
        data: { email: `roteiro-${suffix}@example.com`, name: "Autor" },
      });
      const viewer = await prisma.user.create({
        data: { email: `roteiro-leitor-${suffix}@example.com`, name: "Leitor" },
      });
      const outsider = await prisma.user.create({
        data: { email: `roteiro-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          author.id,
          { name: `Roteiro ${suffix}`, slug: `roteiro-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Outro roteiro ${suffix}`, slug: `outro-roteiro-${suffix}` },
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

        const saved = await saveScript(
          author.id,
          workspaceId,
          project.id,
          { hook: "Gancho", mainMessage: "Mensagem", cta: "Chamada" },
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaScriptRepository,
        );
        const updated = await saveScript(
          author.id,
          workspaceId,
          project.id,
          { hook: "Gancho novo", notes: "Nota" },
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaScriptRepository,
        );
        assert.equal(updated.id, saved.id);
        assert.equal(updated.videoProjectId, project.id);
        assert.equal(updated.hook, "Gancho novo");
        assert.equal(updated.mainMessage, "Mensagem");
        assert.equal(updated.notes, "Nota");

        const read = await getScript(
          viewer.id,
          workspaceId,
          project.id,
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaScriptRepository,
        );
        assert.equal(read?.id, saved.id);

        await assert.rejects(
          () =>
            saveScript(
              viewer.id,
              workspaceId,
              project.id,
              { hook: "Troca" },
              prismaWorkspaceRepository,
              prismaProjectRepository,
              prismaScriptRepository,
            ),
          ForbiddenError,
        );
        await assert.rejects(
          () =>
            saveScript(
              author.id,
              workspaceId,
              other.id,
              { hook: "Cruzado" },
              prismaWorkspaceRepository,
              prismaProjectRepository,
              prismaScriptRepository,
            ),
          NotFoundError,
        );
        await assert.rejects(
          () =>
            getScript(
              outsider.id,
              foreignId,
              project.id,
              prismaWorkspaceRepository,
              prismaProjectRepository,
              prismaScriptRepository,
            ),
          NotFoundError,
        );
        const foreignScripts = await prisma.script.count({
          where: { videoProjectId: other.id },
        });
        assert.equal(foreignScripts, 0);
        assert.equal(
          (
            await getScript(
              author.id,
              workspaceId,
              project.id,
              prismaWorkspaceRepository,
              prismaProjectRepository,
              prismaScriptRepository,
            )
          )?.hook,
          "Gancho novo",
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
