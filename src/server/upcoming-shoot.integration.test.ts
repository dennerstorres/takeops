import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { notifyUpcomingShoots } from "./upcoming-shoot.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

// "Agora" bem no futuro: só as gravações deste teste caem na janela, mesmo
// com dados de outros testes no banco.
const now = new Date("2099-03-10T12:00:00Z");
const hours = (n: number) => new Date(now.getTime() + n * 3_600_000);

describe(
  "aviso de gravação próxima",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("avisa responsável e participantes uma vez por data marcada", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaNotificationRepository } =
        await import("./notification-prisma.ts");
      const { prismaParticipantRepository } =
        await import("./participant-prisma.ts");
      const { prismaShootRepository } = await import("./shoot-prisma.ts");
      const { prismaUpcomingShootRepository } =
        await import("./upcoming-shoot-prisma.ts");
      const deps = {
        shoots: prismaUpcomingShootRepository,
        participants: prismaParticipantRepository,
        notifications: prismaNotificationRepository,
      };
      const suffix = randomUUID();
      const [owner, camera, left] = await Promise.all(
        ["dono", "camera", "saiu"].map((name) =>
          prisma.user.create({
            data: { email: `up-${name}-${suffix}@example.com`, name },
          }),
        ),
      );
      const workspace = await prisma.workspace.create({
        data: {
          name: "Aviso",
          slug: `aviso-${suffix}`,
          members: {
            create: [
              { userId: owner.id, role: "OWNER" },
              { userId: camera.id, role: "MEMBER" },
            ],
          },
        },
      });
      try {
        const project = await prisma.videoProject.create({
          data: {
            workspaceId: workspace.id,
            title: "Demo",
            format: "DEMO",
            status: "READY_TO_RECORD",
            ownerId: owner.id,
            createdById: owner.id,
            members: {
              create: [
                { userId: camera.id, role: "CAMERA" },
                // Participante que já saiu do workspace não recebe aviso.
                { userId: left.id, role: "EDITOR" },
              ],
            },
          },
        });
        const shoot = (scheduledAt: Date, status = "PLANNED" as const) =>
          prisma.shoot.create({
            data: {
              videoProjectId: project.id,
              title: "Estúdio",
              scheduledAt,
              status,
            },
          });
        const soon = await shoot(hours(2));
        await shoot(hours(30));
        await prisma.shoot.create({
          data: {
            videoProjectId: project.id,
            scheduledAt: hours(3),
            status: "CANCELED",
          },
        });

        // Em sequência: o `prisma dev` (PGlite) quebra com duas queries
        // parametrizadas em paralelo fora de transação. A exclusão entre
        // execuções simultâneas vem do UPDATE único do repositório.
        const first = await notifyUpcomingShoots(deps, now);
        assert.deepEqual(first, { shoots: 1, notifications: 2 });
        const sent = await prisma.notification.findMany({
          where: { workspaceId: workspace.id, type: "SHOOT_UPCOMING" },
        });
        assert.deepEqual(
          sent.map((row) => row.userId).sort(),
          [owner.id, camera.id].sort(),
        );
        assert.equal(
          (sent[0].metadata as { shootId: string }).shootId,
          soon.id,
        );

        assert.deepEqual(await notifyUpcomingShoots(deps, now), {
          shoots: 0,
          notifications: 0,
        });

        // Remarcada: avisa de novo na data nova.
        await prismaShootRepository.update(workspace.id, project.id, soon.id, {
          title: soon.title,
          scheduledAt: hours(5),
          endAt: null,
          location: null,
          status: "PLANNED",
          notes: null,
        });
        const again = await notifyUpcomingShoots(deps, now);
        assert.equal(again.shoots, 1);
        assert.equal(again.notifications, 2);
      } finally {
        await prisma.workspace.delete({ where: { id: workspace.id } });
        await prisma.user.deleteMany({
          where: { id: { in: [owner.id, camera.id, left.id] } },
        });
      }
    });
  },
);
