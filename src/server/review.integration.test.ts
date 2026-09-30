import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { createEditVersion } from "./edit-version.ts";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { createProject } from "./project.ts";
import {
  createReviewComment,
  listReviewComments,
  setReviewCommentResolved,
  type ReviewDeps,
} from "./review.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "comentário de revisão no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("guarda comentário na versão e barra quem não pode", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaEditVersionRepository } =
        await import("./edit-version-prisma.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaReviewRepository } = await import("./review-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const deps: ReviewDeps = {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        versions: prismaEditVersionRepository,
        reviews: prismaReviewRepository,
      };
      const suffix = randomUUID();
      const author = await prisma.user.create({
        data: { email: `rev-${suffix}@example.com`, name: "Autor" },
      });
      const member = await prisma.user.create({
        data: { email: `rev-membro-${suffix}@example.com`, name: "Membro" },
      });
      const viewer = await prisma.user.create({
        data: { email: `rev-leitor-${suffix}@example.com`, name: "Leitor" },
      });
      const outsider = await prisma.user.create({
        data: { email: `rev-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          author.id,
          { name: `Revisão ${suffix}`, slug: `revisao-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Outra revisão ${suffix}`, slug: `outra-rev-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        foreignId = foreign.workspace.id;
        await prisma.workspaceMember.createMany({
          data: [
            { workspaceId, userId: member.id, role: "MEMBER" },
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
          { previewUrl: "https://vimeo.com/1" },
          deps,
        );
        const v2 = await createEditVersion(
          author.id,
          workspaceId,
          project.id,
          { previewUrl: "https://vimeo.com/2" },
          deps,
        );
        const foreignVersion = await createEditVersion(
          outsider.id,
          foreignId,
          other.id,
          { previewUrl: "https://vimeo.com/3" },
          deps,
        );
        const target = { projectId: project.id, versionId: v1.id };

        const late = await createReviewComment(
          member.id,
          workspaceId,
          target,
          { text: "aumentar legenda", timestamp: "01:04" },
          deps,
        );
        assert.equal(late.authorId, member.id);
        assert.equal(late.resolved, false);
        await createReviewComment(
          author.id,
          workspaceId,
          target,
          { text: "no geral ficou bom" },
          deps,
        );
        await createReviewComment(
          author.id,
          workspaceId,
          target,
          { text: " cortar essa pausa ", timestamp: 18 },
          deps,
        );
        await createReviewComment(
          author.id,
          workspaceId,
          { projectId: project.id, versionId: v2.id },
          { text: "outra versão", timestamp: 1 },
          deps,
        );

        const listed = await listReviewComments(
          viewer.id,
          workspaceId,
          target,
          deps,
        );
        assert.deepEqual(
          listed.map((comment) => [comment.timestampSeconds, comment.text]),
          [
            [18, "cortar essa pausa"],
            [64, "aumentar legenda"],
            [null, "no geral ficou bom"],
          ],
        );

        for (const input of [
          { text: " " },
          { text: "x", timestamp: "0:60" },
          { text: "x", timestamp: 1.5 },
          { text: "x", timestamp: 86400 },
          { text: "x", timestamp: "24:00:00" },
          { text: "x", timestamp: -1 },
        ]) {
          await assert.rejects(
            createReviewComment(author.id, workspaceId, target, input, deps),
            ValidationError,
            JSON.stringify(input),
          );
        }
        // Leitor comenta (ADR-044), mas não resolve.
        const byViewer = await createReviewComment(
          viewer.id,
          workspaceId,
          target,
          { text: "leitor" },
          deps,
        );
        assert.equal(byViewer.authorId, viewer.id);
        await assert.rejects(
          setReviewCommentResolved(
            viewer.id,
            workspaceId,
            target,
            byViewer.id,
            { resolved: true },
            deps,
          ),
          ForbiddenError,
        );
        await assert.rejects(
          listReviewComments(
            author.id,
            workspaceId,
            { projectId: sibling.id, versionId: v1.id },
            deps,
          ),
          NotFoundError,
        );
        await assert.rejects(
          createReviewComment(
            author.id,
            workspaceId,
            { projectId: project.id, versionId: foreignVersion.id },
            { text: "alheio" },
            deps,
          ),
          NotFoundError,
        );
        await assert.rejects(
          listReviewComments(outsider.id, workspaceId, target, deps),
          ForbiddenError,
        );

        const now = new Date("2026-10-01T12:00:00.000Z");
        const resolved = await setReviewCommentResolved(
          member.id,
          workspaceId,
          target,
          late.id,
          { resolved: "true" },
          deps,
          now,
        );
        assert.equal(resolved.resolved, true);
        assert.equal(resolved.resolvedById, member.id);
        assert.equal(resolved.resolvedAt?.toISOString(), now.toISOString());
        const reopened = await setReviewCommentResolved(
          author.id,
          workspaceId,
          target,
          late.id,
          { resolved: false },
          deps,
        );
        assert.equal(reopened.resolved, false);
        assert.equal(reopened.resolvedById, null);
        assert.equal(reopened.resolvedAt, null);

        await assert.rejects(
          setReviewCommentResolved(
            viewer.id,
            workspaceId,
            target,
            late.id,
            { resolved: true },
            deps,
          ),
          ForbiddenError,
        );
        await assert.rejects(
          setReviewCommentResolved(
            author.id,
            workspaceId,
            target,
            late.id,
            { resolved: "talvez" },
            deps,
          ),
          ValidationError,
        );
        // Comentário de outra versão não é alcançado pela versão errada.
        await assert.rejects(
          setReviewCommentResolved(
            author.id,
            workspaceId,
            { projectId: project.id, versionId: v2.id },
            late.id,
            { resolved: true },
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
          where: {
            id: { in: [author.id, member.id, viewer.id, outsider.id] },
          },
        });
      }
    });
  },
);
