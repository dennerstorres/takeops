import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import {
  getEditingInfo,
  saveEditingInfo,
  type EditingDeps,
} from "./editing.ts";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { createProject } from "./project.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "edição no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("guarda um registro por produção e valida editor, link e fps", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaEditingRepository } = await import("./editing-prisma.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const deps: EditingDeps = {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        editing: prismaEditingRepository,
      };
      const suffix = randomUUID();
      const author = await prisma.user.create({
        data: { email: `edit-${suffix}@example.com`, name: "Autor" },
      });
      const editor = await prisma.user.create({
        data: { email: `edit-editor-${suffix}@example.com`, name: "Editor" },
      });
      const viewer = await prisma.user.create({
        data: { email: `edit-leitor-${suffix}@example.com`, name: "Leitor" },
      });
      const outsider = await prisma.user.create({
        data: { email: `edit-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          author.id,
          { name: `Edição ${suffix}`, slug: `edicao-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Outra edição ${suffix}`, slug: `outra-edicao-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        foreignId = foreign.workspace.id;
        await prisma.workspaceMember.createMany({
          data: [
            { workspaceId, userId: editor.id, role: "MEMBER" },
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

        assert.equal(
          await getEditingInfo(viewer.id, workspaceId, project.id, deps),
          null,
        );

        const first = await saveEditingInfo(
          editor.id,
          workspaceId,
          project.id,
          {
            editorId: editor.id,
            software: "Premiere Pro",
            projectFileUrl: "https://drive.google.com/file/d/abc",
            targetResolution: "1080x1920",
            targetFps: "29,97",
            aspectRatio: "NINE_SIXTEEN",
            captionsRequired: "on",
          },
          deps,
        );
        assert.equal(first.targetFps, 29.97);
        assert.equal(first.captionsRequired, true);
        assert.equal(first.musicRequired, false);

        const second = await saveEditingInfo(
          author.id,
          workspaceId,
          project.id,
          { software: "DaVinci Resolve", musicRequired: "on" },
          deps,
        );
        assert.equal(second.id, first.id);
        assert.equal(second.editorId, null);
        assert.equal(second.projectFileUrl, null);
        assert.equal(second.musicRequired, true);
        assert.equal(
          await prisma.editingInfo.count({
            where: { videoProjectId: project.id },
          }),
          1,
        );

        const read = await getEditingInfo(
          viewer.id,
          workspaceId,
          project.id,
          deps,
        );
        assert.equal(read?.software, "DaVinci Resolve");

        for (const input of [
          { editorId: outsider.id },
          { projectFileUrl: "javascript:alert(1)" },
          { targetFps: "0" },
          { targetFps: "23.9761" },
          { aspectRatio: "TALL" },
        ]) {
          await assert.rejects(
            saveEditingInfo(author.id, workspaceId, project.id, input, deps),
            ValidationError,
            JSON.stringify(input),
          );
        }
        await assert.rejects(
          saveEditingInfo(viewer.id, workspaceId, project.id, {}, deps),
          ForbiddenError,
        );
        await assert.rejects(
          saveEditingInfo(author.id, workspaceId, other.id, {}, deps),
          NotFoundError,
        );
        await assert.rejects(
          getEditingInfo(outsider.id, workspaceId, project.id, deps),
          ForbiddenError,
        );
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        if (foreignId) {
          await prisma.workspace.deleteMany({ where: { id: foreignId } });
        }
        await prisma.user.deleteMany({
          where: {
            id: { in: [author.id, editor.id, viewer.id, outsider.id] },
          },
        });
      }
    });
  },
);
