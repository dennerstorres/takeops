import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { seedDemoWorkspace } from "./seed.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "seed de demonstração",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("cria workspace, quatro pessoas e checklist sem duplicar", async () => {
      const { prisma } = await import("./db.ts");
      const suffix = randomUUID().slice(0, 8);
      const options = {
        slug: `acme-${suffix}`,
        emailDomain: `seed-${suffix}.test`,
      };
      let workspaceId = "";
      let userIds: string[] = [];
      try {
        const first = await seedDemoWorkspace(options);
        const second = await seedDemoWorkspace(options);
        workspaceId = first.workspaceId;
        userIds = first.userIds;
        assert.equal(second.workspaceId, first.workspaceId);
        assert.deepEqual(second.userIds, first.userIds);

        const members = await prisma.workspaceMember.findMany({
          where: { workspaceId },
          include: { user: { select: { name: true } } },
        });
        assert.deepEqual(
          members.map((member) => `${member.user.name}:${member.role}`).sort(),
          ["Dev 1:MEMBER", "Dev 2:MEMBER", "Dev 3:MEMBER", "Supervisor:OWNER"],
        );
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
        });
        assert.equal(workspace?.name, "Acme Software");
        assert.equal(
          await prisma.checklistTemplate.count({ where: { workspaceId } }),
          1,
        );
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
    });
  },
);
