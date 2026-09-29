import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError } from "./errors.ts";
import { describeNotification } from "./notification-labels.ts";
import {
  countMyUnread,
  listMyNotifications,
  markMyNotificationsRead,
  notify,
  type NotificationDeps,
} from "./notification.ts";
import { createProject } from "./project.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe("frase do aviso", () => {
  it("fala com quem recebe", () => {
    assert.equal(
      describeNotification("Ana", "PROJECT_MEMBER_ADDED", "Lançamento", null),
      "Ana adicionou você à produção Lançamento.",
    );
    assert.equal(
      describeNotification("Ana", "VERSION_CREATED", "Lançamento", {
        version: "V2",
      }),
      "Nova versão V2 em Lançamento disponível.",
    );
  });
});

describe(
  "aviso no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("entrega só a membros, não ao autor, e marca como lido", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaNotificationRepository } =
        await import("./notification-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const deps: NotificationDeps = {
        workspaces: prismaWorkspaceRepository,
        notifications: prismaNotificationRepository,
      };
      const suffix = randomUUID();
      const [owner, member, outsider] = await Promise.all(
        ["dono", "membro", "fora"].map((name) =>
          prisma.user.create({
            data: { email: `ntf-${name}-${suffix}@example.com`, name },
          }),
        ),
      );
      let workspaceId = "";
      try {
        workspaceId = (
          await createWorkspace(
            owner.id,
            { name: `Aviso ${suffix}`, slug: `aviso-${suffix}` },
            prismaWorkspaceRepository,
          )
        ).workspace.id;
        await prisma.workspaceMember.create({
          data: { workspaceId, userId: member.id, role: "MEMBER" },
        });
        const project = await createProject(
          owner.id,
          workspaceId,
          { title: `Peça ${suffix}`, format: "DEMO" },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
          prismaProjectRepository,
        );

        const sent = await notify(
          deps.notifications,
          {
            workspaceId,
            actorId: owner.id,
            videoProjectId: project.id,
            type: "VERSION_CREATED",
            metadata: { version: "V1" },
          },
          [owner.id, member.id, member.id, outsider.id, null],
        );
        assert.equal(sent, 1);
        await notify(
          deps.notifications,
          {
            workspaceId,
            actorId: owner.id,
            videoProjectId: project.id,
            type: "VERSION_APPROVED",
            metadata: null,
          },
          [member.id],
        );

        const mine = await listMyNotifications(member.id, workspaceId, deps);
        assert.deepEqual(mine.map((row) => row.type).sort(), [
          "VERSION_APPROVED",
          "VERSION_CREATED",
        ]);
        assert.equal(mine[0].projectTitle, `Peça ${suffix}`);
        assert.deepEqual(
          await listMyNotifications(owner.id, workspaceId, deps),
          [],
        );
        assert.equal(await countMyUnread(member.id, workspaceId, deps), 2);

        // Dono não marca aviso de outra pessoa.
        assert.equal(
          await markMyNotificationsRead(
            owner.id,
            workspaceId,
            mine[0].id,
            deps,
          ),
          0,
        );
        assert.equal(
          await markMyNotificationsRead(
            member.id,
            workspaceId,
            mine[0].id,
            deps,
          ),
          1,
        );
        assert.equal(await countMyUnread(member.id, workspaceId, deps), 1);
        assert.equal(
          await markMyNotificationsRead(member.id, workspaceId, null, deps),
          1,
        );
        assert.equal(await countMyUnread(member.id, workspaceId, deps), 0);

        await assert.rejects(
          listMyNotifications(outsider.id, workspaceId, deps),
          ForbiddenError,
        );
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        await prisma.user.deleteMany({
          where: { id: { in: [owner.id, member.id, outsider.id] } },
        });
      }
    });
  },
);
