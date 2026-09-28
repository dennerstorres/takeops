import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError } from "./errors.ts";
import { createProject } from "./project.ts";
import { createShoot, getShoot, listShoots, type ShootDeps } from "./shoot.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "gravação no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("guarda várias sessões na produção do workspace", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaShootRepository } = await import("./shoot-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const deps: ShootDeps = {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        shoots: prismaShootRepository,
      };
      const suffix = randomUUID();
      const author = await prisma.user.create({
        data: { email: `shoot-${suffix}@example.com`, name: "Autor" },
      });
      const viewer = await prisma.user.create({
        data: { email: `shoot-leitor-${suffix}@example.com`, name: "Leitor" },
      });
      const outsider = await prisma.user.create({
        data: { email: `shoot-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          author.id,
          { name: `Gravação ${suffix}`, slug: `gravacao-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          {
            name: `Outra gravação ${suffix}`,
            slug: `outra-gravacao-${suffix}`,
          },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        foreignId = foreign.workspace.id;
        await prisma.workspaceMember.create({
          data: { workspaceId, userId: viewer.id, role: "VIEWER" },
        });
        const project = await createProject(
          author.id,
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

        const second = await createShoot(
          author.id,
          workspaceId,
          project.id,
          {
            title: "Externa",
            scheduledAt: "2026-10-07T09:00:00-03:00",
            location: "Praça",
            status: "COMPLETED",
          },
          deps,
        );
        const first = await createShoot(
          author.id,
          workspaceId,
          project.id,
          {
            scheduledAt: "2026-10-06T09:00:00Z",
            endAt: "2026-10-06T11:30:00Z",
          },
          deps,
        );
        assert.equal(second.status, "PLANNED");
        assert.equal(
          second.scheduledAt.toISOString(),
          "2026-10-07T12:00:00.000Z",
        );

        const listed = await listShoots(
          viewer.id,
          workspaceId,
          project.id,
          deps,
        );
        assert.deepEqual(
          listed.map((item) => item.id),
          [first.id, second.id],
        );

        await assert.rejects(
          createShoot(
            viewer.id,
            workspaceId,
            project.id,
            { scheduledAt: "2026-10-06T09:00:00Z" },
            deps,
          ),
          ForbiddenError,
        );
        await assert.rejects(
          createShoot(
            author.id,
            workspaceId,
            other.id,
            { scheduledAt: "2026-10-06T09:00:00Z" },
            deps,
          ),
          NotFoundError,
        );
        await assert.rejects(
          listShoots(outsider.id, workspaceId, project.id, deps),
          ForbiddenError,
        );
        await assert.rejects(
          getShoot(outsider.id, foreignId, other.id, first.id, deps),
          NotFoundError,
        );
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        if (foreignId) {
          await prisma.workspace.deleteMany({ where: { id: foreignId } });
        }
        await prisma.user.deleteMany({
          where: { id: { in: [author.id, viewer.id, outsider.id] } },
        });
      }
    });
  },
);
