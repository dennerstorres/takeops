import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { listCalendarEvents, type CalendarDeps } from "./calendar.ts";
import { ForbiddenError, ValidationError } from "./errors.ts";
import { createProject } from "./project.ts";
import { createWorkspace } from "./workspace.ts";
import { testTranslator } from "../i18n/test-translator.ts";

const t = testTranslator();

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "calendário no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("junta gravações, datas planejadas e publicações do workspace", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaCalendarRepository } = await import("./calendar-prisma.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const deps: CalendarDeps = {
        workspaces: prismaWorkspaceRepository,
        calendar: prismaCalendarRepository,
      };
      const suffix = randomUUID();
      const [owner, viewer, outsider] = await Promise.all(
        ["dono", "leitor", "fora"].map((name) =>
          prisma.user.create({
            data: { email: `cal-${name}-${suffix}@example.com`, name },
          }),
        ),
      );
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          owner.id,
          { name: `Calendário ${suffix}`, slug: `calendario-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Outro cal ${suffix}`, slug: `outro-cal-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        foreignId = foreign.workspace.id;
        await prisma.workspaceMember.create({
          data: { workspaceId, userId: viewer.id, role: "VIEWER" },
        });
        const project = await createProject(
          owner.id,
          workspaceId,
          {
            title: `Peça ${suffix}`,
            format: "DEMO",
            plannedPublishDate: "2026-10-01",
          },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
          prismaProjectRepository,
        );
        const outOfRange = await createProject(
          owner.id,
          workspaceId,
          {
            title: `Novembro ${suffix}`,
            format: "DEMO",
            plannedPublishDate: "2026-11-01",
          },
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
        await prisma.shoot.createMany({
          data: [
            {
              videoProjectId: project.id,
              title: "Externa",
              scheduledAt: new Date("2026-10-06T12:00:00Z"),
            },
            {
              videoProjectId: project.id,
              title: "Apagada",
              scheduledAt: new Date("2026-10-07T12:00:00Z"),
              deletedAt: new Date(),
            },
            {
              videoProjectId: other.id,
              scheduledAt: new Date("2026-10-06T12:00:00Z"),
            },
          ],
        });
        await prisma.publication.createMany({
          data: [
            {
              videoProjectId: project.id,
              platform: "TIKTOK",
              status: "SCHEDULED",
              scheduledAt: new Date("2026-10-10T21:30:00Z"),
            },
            {
              videoProjectId: project.id,
              platform: "YOUTUBE_SHORTS",
              status: "PUBLISHED",
              scheduledAt: new Date("2026-09-20T21:30:00Z"),
              publishedAt: new Date("2026-10-02T15:00:00Z"),
            },
            { videoProjectId: project.id, platform: "LINKEDIN" },
          ],
        });

        // Outubro em São Paulo: 01/10 00:00 -03:00 até 01/11 00:00 -03:00.
        const range = {
          from: new Date("2026-10-01T03:00:00Z"),
          to: new Date("2026-11-01T03:00:00Z"),
          timezone: "America/Sao_Paulo",
        };
        const events = await listCalendarEvents(
          viewer.id,
          workspaceId,
          range,
          deps,
          t,
        );
        assert.deepEqual(
          events.map((event) => [event.kind, event.label]),
          [
            ["PLANNED_PUBLISH", "Publicação planejada"],
            ["PUBLICATION", "Publicada · YouTube Shorts"],
            ["SHOOT", "Gravação · Externa"],
            ["PUBLICATION", "Publicação · TikTok"],
          ],
        );
        assert.equal(events[0].day, "2026-10-01");
        assert.ok(events.every((event) => event.projectId === project.id));
        assert.ok(!events.some((event) => event.projectId === outOfRange.id));

        await assert.rejects(
          listCalendarEvents(outsider.id, workspaceId, range, deps, t),
          ForbiddenError,
        );
        await assert.rejects(
          listCalendarEvents(
            owner.id,
            workspaceId,
            {
              from: range.from,
              to: new Date("2027-03-01T00:00:00Z"),
              timezone: range.timezone,
            },
            deps,
            t,
          ),
          ValidationError,
        );
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        if (foreignId) {
          await prisma.workspace.deleteMany({ where: { id: foreignId } });
        }
        await prisma.user.deleteMany({
          where: { id: { in: [owner.id, viewer.id, outsider.id] } },
        });
      }
    });
  },
);
