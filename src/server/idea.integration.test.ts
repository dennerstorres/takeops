import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import {
  changeIdeaStatus,
  createIdea,
  deleteIdea,
  getIdea,
  listIdeas,
  updateIdea,
} from "./idea.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "ideia no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("isola a ideia por workspace e esconde a exclusão lógica", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const suffix = randomUUID();
      const author = await prisma.user.create({
        data: { email: `autor-${suffix}@example.com`, name: "Autor" },
      });
      const viewer = await prisma.user.create({
        data: { email: `leitor-${suffix}@example.com`, name: "Leitor" },
      });
      const outsider = await prisma.user.create({
        data: { email: `fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          author.id,
          { name: `Ideias ${suffix}`, slug: `ideias-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Outra ${suffix}`, slug: `outra-ideia-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        foreignId = foreign.workspace.id;
        await prisma.workspaceMember.create({
          data: { workspaceId, userId: viewer.id, role: "VIEWER" },
        });

        await assert.rejects(
          () =>
            createIdea(
              viewer.id,
              workspaceId,
              { title: "Bloqueada" },
              prismaWorkspaceRepository,
              prismaIdeaRepository,
            ),
          (error: unknown) => error instanceof ForbiddenError,
        );

        const created = await createIdea(
          author.id,
          workspaceId,
          {
            title: `Ideia ${suffix}`,
            format: "TUTORIAL",
            referenceUrl: "https://example.com/ref",
          },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
        );
        assert.equal(created.authorId, author.id);
        assert.equal(created.status, "NEW");

        await assert.rejects(
          () =>
            getIdea(
              outsider.id,
              foreignId,
              created.id,
              prismaWorkspaceRepository,
              prismaIdeaRepository,
            ),
          (error: unknown) => error instanceof NotFoundError,
        );

        const updated = await updateIdea(
          author.id,
          workspaceId,
          created.id,
          { title: `Editada ${suffix}` },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
        );
        assert.equal(updated.status, "NEW");

        await assert.rejects(
          () =>
            changeIdeaStatus(
              viewer.id,
              workspaceId,
              created.id,
              { status: "APPROVED" },
              prismaWorkspaceRepository,
              prismaIdeaRepository,
            ),
          (error: unknown) => error instanceof ForbiddenError,
        );
        await assert.rejects(
          () =>
            changeIdeaStatus(
              outsider.id,
              workspaceId,
              created.id,
              { status: "DISCARDED" },
              prismaWorkspaceRepository,
              prismaIdeaRepository,
            ),
          (error: unknown) => error instanceof ForbiddenError,
        );
        await assert.rejects(
          () =>
            changeIdeaStatus(
              author.id,
              workspaceId,
              created.id,
              { status: "CONVERTED" },
              prismaWorkspaceRepository,
              prismaIdeaRepository,
            ),
          (error: unknown) => error instanceof ValidationError,
        );
        const reviewed = await changeIdeaStatus(
          author.id,
          workspaceId,
          created.id,
          { status: "UNDER_REVIEW" },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
        );
        assert.equal(reviewed.status, "UNDER_REVIEW");

        await deleteIdea(
          author.id,
          workspaceId,
          created.id,
          prismaWorkspaceRepository,
          prismaIdeaRepository,
        );
        const listed = await listIdeas(
          viewer.id,
          workspaceId,
          prismaWorkspaceRepository,
          prismaIdeaRepository,
        );
        assert.equal(
          listed.some((idea) => idea.id === created.id),
          false,
        );
        const stored = await prisma.idea.findFirst({
          where: { id: created.id },
        });
        assert.ok(stored?.deletedAt);
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
