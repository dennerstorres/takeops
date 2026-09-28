import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { createIdea } from "./idea.ts";
import {
  convertIdeaToProject,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  changeVideoProjectStatus,
  submitBoardMove,
  updateProject,
} from "./project.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "produção no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("grava a produção no workspace e não liga ideia de outro", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const suffix = randomUUID();
      const author = await prisma.user.create({
        data: { email: `prod-${suffix}@example.com`, name: "Autor" },
      });
      const outsider = await prisma.user.create({
        data: { email: `prod-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          author.id,
          { name: `Prod ${suffix}`, slug: `prod-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Outra prod ${suffix}`, slug: `outra-prod-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        foreignId = foreign.workspace.id;
        const idea = await createIdea(
          author.id,
          workspaceId,
          { title: `Origem ${suffix}` },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
        );
        const foreignIdea = await createIdea(
          outsider.id,
          foreignId,
          { title: `Alheia ${suffix}` },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
        );

        const created = await createProject(
          author.id,
          workspaceId,
          { title: `Vídeo ${suffix}`, format: "DEMO", sourceIdeaId: idea.id },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
          prismaProjectRepository,
        );
        assert.equal(created.status, "IDEA");
        assert.equal(created.priority, "NORMAL");
        assert.equal(created.aspectRatio, "NINE_SIXTEEN");
        assert.equal(created.createdById, author.id);
        assert.equal(created.sourceIdeaId, idea.id);

        await assert.rejects(
          () =>
            createProject(
              author.id,
              workspaceId,
              {
                title: `Cruzado ${suffix}`,
                format: "DEMO",
                sourceIdeaId: foreignIdea.id,
              },
              prismaWorkspaceRepository,
              prismaIdeaRepository,
              prismaProjectRepository,
            ),
          (error: unknown) =>
            error instanceof ValidationError &&
            error.fields.sourceIdeaId !== undefined,
        );
        const stored = await getProject(
          author.id,
          workspaceId,
          created.id,
          prismaWorkspaceRepository,
          prismaProjectRepository,
        );
        const updated = await updateProject(
          author.id,
          workspaceId,
          created.id,
          {
            title: `Vídeo editado ${suffix}`,
            format: "DEMO",
            status: "PUBLISHED",
          },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
          prismaProjectRepository,
        );
        assert.equal(updated.status, "IDEA");
        assert.equal(updated.createdById, author.id);
        const moved = await changeVideoProjectStatus(
          author.id,
          workspaceId,
          created.id,
          { status: "RECORDING" },
          prismaWorkspaceRepository,
          prismaProjectRepository,
        );
        assert.equal(moved.status, "RECORDING");
        const reread = await getProject(
          author.id,
          workspaceId,
          created.id,
          prismaWorkspaceRepository,
          prismaProjectRepository,
        );
        assert.equal(reread.status, "RECORDING");
        await assert.rejects(
          () =>
            changeVideoProjectStatus(
              outsider.id,
              workspaceId,
              created.id,
              { status: "PUBLISHED" },
              prismaWorkspaceRepository,
              prismaProjectRepository,
            ),
          (error: unknown) => error instanceof ForbiddenError,
        );
        const keptStatus = await prisma.videoProject.findFirst({
          where: { id: created.id },
        });
        assert.equal(keptStatus?.status, "RECORDING");
        const dragged = await submitBoardMove(
          author.id,
          workspaceId,
          {
            projectId: created.id,
            status: "REVIEW",
            workspaceId: foreignId,
          },
          prismaWorkspaceRepository,
          prismaProjectRepository,
        );
        assert.equal(dragged.status, "REVIEW");
        assert.equal(dragged.workspaceId, workspaceId);
        assert.equal(stored.title, `Vídeo ${suffix}`);
        await assert.rejects(
          () =>
            getProject(
              outsider.id,
              foreignId,
              created.id,
              prismaWorkspaceRepository,
              prismaProjectRepository,
            ),
          (error: unknown) => error instanceof NotFoundError,
        );

        await deleteProject(
          author.id,
          workspaceId,
          created.id,
          prismaWorkspaceRepository,
          prismaProjectRepository,
        );
        const listed = await listProjects(
          author.id,
          workspaceId,
          prismaWorkspaceRepository,
          prismaProjectRepository,
        );
        assert.equal(
          listed.some((item) => item.id === created.id),
          false,
        );
        const kept = await prisma.videoProject.findFirst({
          where: { id: created.id },
        });
        assert.ok(kept?.deletedAt);

        const converted = await convertIdeaToProject(
          author.id,
          workspaceId,
          idea.id,
          prismaWorkspaceRepository,
          prismaProjectRepository,
        );
        assert.equal(converted.sourceIdeaId, idea.id);
        assert.equal(converted.status, "IDEA");
        assert.equal(converted.title, idea.title);
        const ideaRow = await prisma.idea.findFirst({ where: { id: idea.id } });
        assert.equal(ideaRow?.status, "CONVERTED");
        await assert.rejects(
          () =>
            convertIdeaToProject(
              author.id,
              workspaceId,
              idea.id,
              prismaWorkspaceRepository,
              prismaProjectRepository,
            ),
          (error: unknown) =>
            error instanceof ValidationError && error.fields.idea !== undefined,
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
