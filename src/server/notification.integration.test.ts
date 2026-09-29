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
import { approveVersion, requestApproval } from "./approval.ts";
import { createEditVersion } from "./edit-version.ts";
import { addParticipant } from "./participant.ts";
import { createProject } from "./project.ts";
import { createReviewComment } from "./review.ts";
import { createWorkspace } from "./workspace.ts";
import { testTranslator } from "../i18n/test-translator.ts";

const t = testTranslator();

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe("frase do aviso", () => {
  it("fala com quem recebe", () => {
    assert.equal(
      describeNotification(
        t,
        "Ana",
        "PROJECT_MEMBER_ADDED",
        "Lançamento",
        null,
      ),
      "Ana adicionou você à produção Lançamento.",
    );
    assert.equal(
      describeNotification(t, "Ana", "VERSION_CREATED", "Lançamento", {
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

    it("avisa quem acompanha: participante, versão, comentário e aprovação", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaApprovalRepository } = await import("./approval-prisma.ts");
      const { prismaEditVersionRepository } =
        await import("./edit-version-prisma.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaNotificationRepository } =
        await import("./notification-prisma.ts");
      const { prismaParticipantRepository } =
        await import("./participant-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaReviewRepository } = await import("./review-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const deps = {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        versions: prismaEditVersionRepository,
        approvals: prismaApprovalRepository,
        reviews: prismaReviewRepository,
        participants: prismaParticipantRepository,
        notifications: prismaNotificationRepository,
      };
      const suffix = randomUUID();
      const [owner, editor] = await Promise.all(
        ["dono", "editor"].map((name) =>
          prisma.user.create({
            data: { email: `ntf-flow-${name}-${suffix}@example.com`, name },
          }),
        ),
      );
      let workspaceId = "";
      const types = async (userId: string) =>
        (await listMyNotifications(userId, workspaceId, deps))
          .map((row) => row.type)
          .sort();
      try {
        workspaceId = (
          await createWorkspace(
            owner.id,
            { name: `Fluxo aviso ${suffix}`, slug: `fluxo-aviso-${suffix}` },
            prismaWorkspaceRepository,
          )
        ).workspace.id;
        await prisma.workspaceMember.create({
          data: { workspaceId, userId: editor.id, role: "MEMBER" },
        });
        const project = await createProject(
          owner.id,
          workspaceId,
          { title: `Peça ${suffix}`, format: "DEMO", ownerId: owner.id },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
          prismaProjectRepository,
        );
        await addParticipant(
          owner.id,
          workspaceId,
          project.id,
          { userId: editor.id, role: "EDITOR" },
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaParticipantRepository,
          prismaNotificationRepository,
        );
        const version = await createEditVersion(
          owner.id,
          workspaceId,
          project.id,
          { previewUrl: "https://vimeo.com/1" },
          deps,
        );
        assert.deepEqual(await types(editor.id), [
          "PROJECT_MEMBER_ADDED",
          "VERSION_CREATED",
        ]);
        assert.deepEqual(await types(owner.id), []);

        await createReviewComment(
          editor.id,
          workspaceId,
          { projectId: project.id, versionId: version.id },
          { text: "cortar pausa", timestamp: "00:18" },
          deps,
        );
        const pending = await requestApproval(
          editor.id,
          workspaceId,
          project.id,
          version.id,
          deps,
        );
        await approveVersion(
          owner.id,
          workspaceId,
          project.id,
          pending.id,
          {},
          deps,
        );
        assert.deepEqual(await types(owner.id), ["REVIEW_COMMENT_CREATED"]);
        assert.deepEqual(await types(editor.id), [
          "PROJECT_MEMBER_ADDED",
          "VERSION_APPROVED",
          "VERSION_CREATED",
        ]);
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        await prisma.user.deleteMany({
          where: { id: { in: [owner.id, editor.id] } },
        });
      }
    });
  },
);
