import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError } from "./errors.ts";
import { createWorkspace, getWorkspace, listWorkspaces } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "workspace no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("não deixa um usuário ler o workspace do outro", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const suffix = randomUUID();
      const userA = await prisma.user.create({
        data: { email: `a-${suffix}@example.com`, name: "A" },
      });
      const userB = await prisma.user.create({
        data: { email: `b-${suffix}@example.com`, name: "B" },
      });
      let workspaceAId = "";
      let workspaceBId = "";

      try {
        const workspaceA = await createWorkspace(
          userA.id,
          { name: `Time A ${suffix}`, slug: `time-a-${suffix}` },
          prismaWorkspaceRepository,
        );
        const workspaceB = await createWorkspace(
          userB.id,
          { name: `Time B ${suffix}`, slug: `time-b-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceAId = workspaceA.workspace.id;
        workspaceBId = workspaceB.workspace.id;

        const loaded = await getWorkspace(
          userA.id,
          workspaceAId,
          prismaWorkspaceRepository,
        );
        assert.equal(loaded.membership.role, "OWNER");

        const listed = await listWorkspaces(
          userA.id,
          prismaWorkspaceRepository,
        );
        assert.equal(
          listed.some((item) => item.workspace.id === workspaceBId),
          false,
        );

        await assert.rejects(
          () => getWorkspace(userA.id, workspaceBId, prismaWorkspaceRepository),
          (error: unknown) => error instanceof ForbiddenError,
        );

        const foreignMembership = await prisma.workspaceMember.findFirst({
          where: { userId: userA.id, workspaceId: workspaceBId },
        });
        assert.equal(foreignMembership, null);
      } finally {
        if (workspaceAId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceAId } });
        }
        if (workspaceBId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceBId } });
        }
        await prisma.user.deleteMany({
          where: { id: { in: [userA.id, userB.id] } },
        });
      }
    });
  },
);
