import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError } from "./errors.ts";
import { listTeam } from "./team.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "equipe no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("não lista membros de outro workspace", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const suffix = randomUUID();
      const owner = await prisma.user.create({
        data: {
          email: `owner-${suffix}@example.com`,
          name: "Dono",
          image: "https://cdn.example/dono.png",
        },
      });
      const member = await prisma.user.create({
        data: { email: `membro-${suffix}@example.com`, name: "Membro" },
      });
      const outsider = await prisma.user.create({
        data: { email: `fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          owner.id,
          { name: `Equipe ${suffix}`, slug: `equipe-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Outra ${suffix}`, slug: `outra-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        foreignId = foreign.workspace.id;
        await prisma.workspaceMember.create({
          data: { workspaceId, userId: member.id, role: "MEMBER" },
        });

        const listed = await listTeam(
          member.id,
          workspaceId,
          prismaWorkspaceRepository,
        );
        assert.deepEqual(
          listed.map((person) => person.email),
          [`owner-${suffix}@example.com`, `membro-${suffix}@example.com`],
        );
        assert.equal(listed[0]?.role, "OWNER");
        assert.equal(listed[0]?.image, "https://cdn.example/dono.png");

        await assert.rejects(
          () => listTeam(member.id, foreignId, prismaWorkspaceRepository),
          (error: unknown) => error instanceof ForbiddenError,
        );
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        if (foreignId) {
          await prisma.workspace.deleteMany({ where: { id: foreignId } });
        }
        await prisma.user.deleteMany({
          where: { id: { in: [owner.id, member.id, outsider.id] } },
        });
      }
    });
  },
);
