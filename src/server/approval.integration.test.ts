import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import {
  approveVersion,
  listApprovals,
  requestApproval,
  requestChanges,
  type ApprovalDeps,
} from "./approval.ts";
import { createEditVersion } from "./edit-version.ts";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { createProject } from "./project.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

async function setup() {
  const { prisma } = await import("./db.ts");
  const { prismaApprovalRepository } = await import("./approval-prisma.ts");
  const { prismaEditVersionRepository } =
    await import("./edit-version-prisma.ts");
  const { prismaIdeaRepository } = await import("./idea-prisma.ts");
  const { prismaProjectRepository } = await import("./project-prisma.ts");
  const { prismaWorkspaceRepository } = await import("./workspace-prisma.ts");
  const deps: ApprovalDeps = {
    workspaces: prismaWorkspaceRepository,
    projects: prismaProjectRepository,
    versions: prismaEditVersionRepository,
    approvals: prismaApprovalRepository,
  };
  const suffix = randomUUID();
  const [owner, admin, member, approver, viewer, outsider] = await Promise.all(
    ["dono", "admin", "membro", "aprovador", "leitor", "fora"].map((name) =>
      prisma.user.create({
        data: { email: `apr-${name}-${suffix}@example.com`, name },
      }),
    ),
  );
  const workspace = await createWorkspace(
    owner.id,
    { name: `Aprovação ${suffix}`, slug: `aprovacao-${suffix}` },
    prismaWorkspaceRepository,
  );
  const foreign = await createWorkspace(
    outsider.id,
    { name: `Outra aprovação ${suffix}`, slug: `outra-apr-${suffix}` },
    prismaWorkspaceRepository,
  );
  const workspaceId = workspace.workspace.id;
  const foreignId = foreign.workspace.id;
  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId, userId: admin.id, role: "ADMIN" },
      { workspaceId, userId: member.id, role: "MEMBER" },
      { workspaceId, userId: approver.id, role: "MEMBER" },
      { workspaceId, userId: viewer.id, role: "VIEWER" },
    ],
  });
  const project = await createProject(
    owner.id,
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
  const version = (projectId: string, userId: string, wsId: string) =>
    createEditVersion(
      userId,
      wsId,
      projectId,
      { previewUrl: "https://vimeo.com/x" },
      deps,
    );
  const v1 = await version(project.id, owner.id, workspaceId);
  const v2 = await version(project.id, owner.id, workspaceId);
  const foreignVersion = await version(other.id, outsider.id, foreignId);

  return {
    prisma,
    deps,
    workspaceId,
    project,
    v1,
    v2,
    foreignVersion,
    owner,
    admin,
    member,
    approver,
    viewer,
    outsider,
    async cleanup() {
      await prisma.workspace.deleteMany({
        where: { id: { in: [workspaceId, foreignId] } },
      });
      await prisma.user.deleteMany({
        where: {
          id: {
            in: [owner, admin, member, approver, viewer, outsider].map(
              (user) => user.id,
            ),
          },
        },
      });
    },
  };
}

describe(
  "aprovação no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("pede aprovação de uma versão, um pedido aberto por produção", async () => {
      const ctx = await setup();
      try {
        const { deps, workspaceId, project, v1, v2 } = ctx;
        const pending = await requestApproval(
          ctx.member.id,
          workspaceId,
          project.id,
          v1.id,
          deps,
        );
        assert.equal(pending.status, "PENDING");
        assert.equal(pending.requestedById, ctx.member.id);
        assert.equal(pending.editVersionId, v1.id);

        const again = await requestApproval(
          ctx.owner.id,
          workspaceId,
          project.id,
          v1.id,
          deps,
        );
        assert.equal(again.id, pending.id);
        await assert.rejects(
          requestApproval(ctx.owner.id, workspaceId, project.id, v2.id, deps),
          ValidationError,
        );

        const listed = await listApprovals(
          ctx.viewer.id,
          workspaceId,
          project.id,
          deps,
        );
        assert.deepEqual(
          listed.map((row) => row.id),
          [pending.id],
        );

        await assert.rejects(
          requestApproval(ctx.viewer.id, workspaceId, project.id, v1.id, deps),
          ForbiddenError,
        );
        await assert.rejects(
          requestApproval(
            ctx.owner.id,
            workspaceId,
            project.id,
            ctx.foreignVersion.id,
            deps,
          ),
          NotFoundError,
        );
        await assert.rejects(
          listApprovals(ctx.outsider.id, workspaceId, project.id, deps),
          ForbiddenError,
        );
      } finally {
        await ctx.cleanup();
      }
    });

    it("solicitar alterações devolve a produção para edição", async () => {
      const ctx = await setup();
      try {
        const { deps, workspaceId, project, v1, v2, prisma } = ctx;
        const pending = await requestApproval(
          ctx.member.id,
          workspaceId,
          project.id,
          v1.id,
          deps,
        );
        await assert.rejects(
          requestChanges(
            ctx.member.id,
            workspaceId,
            project.id,
            pending.id,
            { notes: "trocar música" },
            deps,
          ),
          ForbiddenError,
        );
        await assert.rejects(
          requestChanges(
            ctx.admin.id,
            workspaceId,
            project.id,
            pending.id,
            { notes: " " },
            deps,
          ),
          ValidationError,
        );

        const now = new Date("2026-10-02T15:00:00.000Z");
        const decided = await requestChanges(
          ctx.admin.id,
          workspaceId,
          project.id,
          pending.id,
          { notes: "trocar música" },
          deps,
          now,
        );
        assert.equal(decided.status, "CHANGES_REQUESTED");
        assert.equal(decided.reviewedById, ctx.admin.id);
        assert.equal(decided.reviewedAt?.toISOString(), now.toISOString());
        assert.equal(decided.notes, "trocar música");
        const stored = await prisma.videoProject.findUnique({
          where: { id: project.id },
          select: { status: true },
        });
        assert.equal(stored?.status, "EDITING");

        // Decidido não se decide de novo; o próximo pedido pode sair.
        await assert.rejects(
          requestChanges(
            ctx.owner.id,
            workspaceId,
            project.id,
            pending.id,
            { notes: "de novo" },
            deps,
          ),
          NotFoundError,
        );
        const next = await requestApproval(
          ctx.member.id,
          workspaceId,
          project.id,
          v2.id,
          deps,
        );
        assert.equal(next.status, "PENDING");
      } finally {
        await ctx.cleanup();
      }
    });

    it("aprovar a versão aprova a produção", async () => {
      const ctx = await setup();
      try {
        const { deps, workspaceId, project, v2, prisma } = ctx;
        const pending = await requestApproval(
          ctx.member.id,
          workspaceId,
          project.id,
          v2.id,
          deps,
        );
        await assert.rejects(
          approveVersion(
            ctx.member.id,
            workspaceId,
            project.id,
            pending.id,
            {},
            deps,
          ),
          ForbiddenError,
        );
        await assert.rejects(
          approveVersion(
            ctx.viewer.id,
            workspaceId,
            project.id,
            pending.id,
            {},
            deps,
          ),
          ForbiddenError,
        );

        const approved = await approveVersion(
          ctx.owner.id,
          workspaceId,
          project.id,
          pending.id,
          { notes: "" },
          deps,
        );
        assert.equal(approved.status, "APPROVED");
        assert.equal(approved.reviewedById, ctx.owner.id);
        assert.equal(approved.notes, null);
        const stored = await prisma.videoProject.findUnique({
          where: { id: project.id },
          select: { status: true },
        });
        assert.equal(stored?.status, "APPROVED");

        await assert.rejects(
          requestChanges(
            ctx.admin.id,
            workspaceId,
            project.id,
            pending.id,
            { notes: "tarde demais" },
            deps,
          ),
          NotFoundError,
        );
      } finally {
        await ctx.cleanup();
      }
    });
  },
);
