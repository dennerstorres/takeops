import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError } from "./errors.ts";
import { changeMemberRole, listTeam } from "./team.ts";
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

    it("só dono e admin mudam os papéis permitidos", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const suffix = randomUUID();
      const owner = await prisma.user.create({
        data: { email: `dono-${suffix}@example.com`, name: "Dono" },
      });
      const admin = await prisma.user.create({
        data: { email: `admin-${suffix}@example.com`, name: "Admin" },
      });
      const viewer = await prisma.user.create({
        data: { email: `leitor-${suffix}@example.com`, name: "Leitor" },
      });
      let workspaceId = "";

      try {
        const workspace = await createWorkspace(
          owner.id,
          { name: `Papeis ${suffix}`, slug: `papeis-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        await prisma.workspaceMember.createMany({
          data: [
            { workspaceId, userId: admin.id, role: "ADMIN" },
            { workspaceId, userId: viewer.id, role: "VIEWER" },
          ],
        });

        await assert.rejects(
          () =>
            changeMemberRole(
              viewer.id,
              workspaceId,
              { userId: admin.id, role: "MEMBER" },
              prismaWorkspaceRepository,
            ),
          (error: unknown) => error instanceof ForbiddenError,
        );
        await assert.rejects(
          () =>
            changeMemberRole(
              admin.id,
              workspaceId,
              { userId: owner.id, role: "MEMBER" },
              prismaWorkspaceRepository,
            ),
          (error: unknown) => error instanceof ForbiddenError,
        );

        const changed = await changeMemberRole(
          admin.id,
          workspaceId,
          { userId: viewer.id, role: "MEMBER" },
          prismaWorkspaceRepository,
        );
        assert.equal(changed.role, "MEMBER");

        const promoted = await changeMemberRole(
          owner.id,
          workspaceId,
          { userId: viewer.id, role: "ADMIN" },
          prismaWorkspaceRepository,
        );
        assert.equal(promoted.role, "ADMIN");
        assert.equal(
          (
            await prisma.workspaceMember.findFirst({
              where: { workspaceId, userId: owner.id },
            })
          )?.role,
          "OWNER",
        );
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        await prisma.user.deleteMany({
          where: { id: { in: [owner.id, admin.id, viewer.id] } },
        });
      }
    });
  },
);
