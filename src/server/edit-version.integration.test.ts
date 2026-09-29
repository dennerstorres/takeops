import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import {
  createEditVersion,
  getEditVersion,
  listEditVersions,
  type EditVersionDeps,
} from "./edit-version.ts";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { createProject } from "./project.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "versão de edição no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("numera por produção, guarda links e barra quem não pode", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaEditVersionRepository } =
        await import("./edit-version-prisma.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const deps: EditVersionDeps = {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        versions: prismaEditVersionRepository,
      };
      const suffix = randomUUID();
      const author = await prisma.user.create({
        data: { email: `versao-${suffix}@example.com`, name: "Autor" },
      });
      const viewer = await prisma.user.create({
        data: { email: `versao-leitor-${suffix}@example.com`, name: "Leitor" },
      });
      const outsider = await prisma.user.create({
        data: { email: `versao-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          author.id,
          { name: `Versão ${suffix}`, slug: `versao-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Outra versão ${suffix}`, slug: `outra-versao-${suffix}` },
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
        const sibling = await createProject(
          author.id,
          workspaceId,
          { title: `Irmã ${suffix}`, format: "DEMO" },
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

        const v1 = await createEditVersion(
          author.id,
          workspaceId,
          project.id,
          {
            title: "Primeiro corte",
            previewUrl: "https://vimeo.com/123",
            versionNumber: 9,
          },
          deps,
        );
        assert.equal(v1.versionNumber, 1);
        assert.equal(v1.createdById, author.id);
        const v2 = await createEditVersion(
          author.id,
          workspaceId,
          project.id,
          { fileUrl: "https://drive.google.com/file/d/x" },
          deps,
        );
        assert.equal(v2.versionNumber, 2);
        const siblingV1 = await createEditVersion(
          author.id,
          workspaceId,
          sibling.id,
          { previewUrl: "https://vimeo.com/999" },
          deps,
        );
        assert.equal(siblingV1.versionNumber, 1);
        const foreignV1 = await createEditVersion(
          outsider.id,
          foreignId,
          other.id,
          { previewUrl: "https://vimeo.com/1" },
          deps,
        );

        const listed = await listEditVersions(
          viewer.id,
          workspaceId,
          project.id,
          deps,
        );
        assert.deepEqual(
          listed.map((version) => version.versionNumber),
          [2, 1],
        );
        assert.equal(
          (
            await getEditVersion(
              viewer.id,
              workspaceId,
              project.id,
              v1.id,
              deps,
            )
          ).title,
          "Primeiro corte",
        );

        await assert.rejects(
          createEditVersion(
            author.id,
            workspaceId,
            project.id,
            { title: "Sem link" },
            deps,
          ),
          ValidationError,
        );
        await assert.rejects(
          createEditVersion(
            author.id,
            workspaceId,
            project.id,
            { previewUrl: "javascript:alert(1)" },
            deps,
          ),
          ValidationError,
        );
        await assert.rejects(
          createEditVersion(
            viewer.id,
            workspaceId,
            project.id,
            { previewUrl: "https://vimeo.com/2" },
            deps,
          ),
          ForbiddenError,
        );
        await assert.rejects(
          getEditVersion(author.id, workspaceId, sibling.id, v1.id, deps),
          NotFoundError,
        );
        await assert.rejects(
          getEditVersion(
            author.id,
            workspaceId,
            project.id,
            foreignV1.id,
            deps,
          ),
          NotFoundError,
        );
        await assert.rejects(
          createEditVersion(
            author.id,
            workspaceId,
            other.id,
            { previewUrl: "https://vimeo.com/3" },
            deps,
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
          where: { id: { in: [author.id, viewer.id, outsider.id] } },
        });
      }
    });
  },
);
