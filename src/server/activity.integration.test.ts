import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { describeActivity } from "./activity-labels.ts";
import {
  listProjectActivity,
  recordActivity,
  type ActivityDeps,
} from "./activity.ts";
import { ForbiddenError, NotFoundError } from "./errors.ts";
import { createProject } from "./project.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe("frase da atividade", () => {
  it("fala como a spec", () => {
    assert.equal(
      describeActivity("Denner", "VERSION_CREATED", { version: "V2" }),
      "Denner adicionou a versão V2.",
    );
    assert.equal(
      describeActivity("Daniel", "VERSION_APPROVED", { version: "V3" }),
      "Daniel aprovou o vídeo da V3.",
    );
    assert.equal(
      describeActivity("Ana", "PROJECT_STATUS_CHANGED", null),
      "Ana mudou a etapa da produção.",
    );
  });
});

describe(
  "atividade no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("lista a atividade da produção, mais nova primeiro", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaActivityRepository } = await import("./activity-prisma.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const deps: ActivityDeps = {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        activities: prismaActivityRepository,
      };
      const suffix = randomUUID();
      const [owner, viewer, outsider] = await Promise.all(
        ["dono", "leitor", "fora"].map((name) =>
          prisma.user.create({
            data: { email: `act-${name}-${suffix}@example.com`, name },
          }),
        ),
      );
      let workspaceId = "";
      let foreignId = "";
      try {
        workspaceId = (
          await createWorkspace(
            owner.id,
            { name: `Atividade ${suffix}`, slug: `atividade-${suffix}` },
            prismaWorkspaceRepository,
          )
        ).workspace.id;
        foreignId = (
          await createWorkspace(
            outsider.id,
            { name: `Outra atv ${suffix}`, slug: `outra-atv-${suffix}` },
            prismaWorkspaceRepository,
          )
        ).workspace.id;
        await prisma.workspaceMember.create({
          data: { workspaceId, userId: viewer.id, role: "VIEWER" },
        });
        const project = await createProject(
          owner.id,
          workspaceId,
          { title: `Peça ${suffix}`, format: "DEMO" },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
          prismaProjectRepository,
        );
        const sibling = await createProject(
          owner.id,
          workspaceId,
          { title: `Irmã ${suffix}`, format: "DEMO" },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
          prismaProjectRepository,
        );
        // Ignora o que a criação já registrou (ACTIVITY-002 em diante).
        await prisma.activityLog.deleteMany({ where: { workspaceId } });

        await recordActivity(deps.activities, {
          workspaceId,
          videoProjectId: project.id,
          userId: owner.id,
          action: "VERSION_CREATED",
          entityType: "EditVersion",
          entityId: null,
          metadata: { version: "V1" },
        });
        await new Promise((resolve) => setTimeout(resolve, 5));
        await recordActivity(deps.activities, {
          workspaceId,
          videoProjectId: project.id,
          userId: owner.id,
          action: "VERSION_APPROVED",
          entityType: "Approval",
          entityId: null,
          metadata: { version: "V1" },
        });
        await recordActivity(deps.activities, {
          workspaceId,
          videoProjectId: sibling.id,
          userId: owner.id,
          action: "PROJECT_CREATED",
          entityType: "VideoProject",
          entityId: sibling.id,
          metadata: null,
        });
        // Ação desconhecida gravada por fora não aparece na tela.
        await prisma.activityLog.create({
          data: { workspaceId, videoProjectId: project.id, action: "OPENED" },
        });

        const listed = await listProjectActivity(
          viewer.id,
          workspaceId,
          project.id,
          deps,
        );
        assert.deepEqual(
          listed.map((row) => row.action),
          ["VERSION_APPROVED", "VERSION_CREATED"],
        );
        assert.deepEqual(listed[0].metadata, { version: "V1" });

        await assert.rejects(
          listProjectActivity(outsider.id, workspaceId, project.id, deps),
          ForbiddenError,
        );
        const other = await createProject(
          outsider.id,
          foreignId,
          { title: `Alheia ${suffix}`, format: "DEMO" },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
          prismaProjectRepository,
        );
        await assert.rejects(
          listProjectActivity(owner.id, workspaceId, other.id, deps),
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
          where: { id: { in: [owner.id, viewer.id, outsider.id] } },
        });
      }
    });
  },
);
