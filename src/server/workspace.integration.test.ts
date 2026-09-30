import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError } from "./errors.ts";
import {
  createWorkspace,
  getWorkspace,
  listWorkspaces,
  updateWorkspaceSettings,
} from "./workspace.ts";

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

        // Configurações: o dono de A muda A; B não muda pelo id enviado.
        const renamed = await updateWorkspaceSettings(
          userA.id,
          workspaceAId,
          { name: "Time A novo", timezone: "America/Sao_Paulo", logoUrl: "" },
          prismaWorkspaceRepository,
        );
        assert.equal(renamed.timezone, "America/Sao_Paulo");
        await assert.rejects(
          () =>
            updateWorkspaceSettings(
              userA.id,
              workspaceBId,
              { name: "Invadido", timezone: "UTC" },
              prismaWorkspaceRepository,
            ),
          (error: unknown) => error instanceof ForbiddenError,
        );
        const untouched = await prisma.workspace.findUnique({
          where: { id: workspaceBId },
        });
        assert.equal(untouched?.name, `Time B ${suffix}`);
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
