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
import { approveVersion, requestApproval, requestChanges } from "./approval.ts";
import { createEditVersion } from "./edit-version.ts";
import { changeVideoProjectStatus, createProject } from "./project.ts";
import {
  recordPublicationOutcome,
  schedulePublication,
} from "./publication.ts";
import { createWorkspace } from "./workspace.ts";
import { testTranslator } from "../i18n/test-translator.ts";

const t = testTranslator();

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe("frase da atividade", () => {
  it("fala como a spec", () => {
    assert.equal(
      describeActivity(t, "Ana", "VERSION_CREATED", { version: "V2" }),
      "Ana adicionou a versão V2.",
    );
    assert.equal(
      describeActivity(t, "Daniel", "VERSION_APPROVED", { version: "V3" }),
      "Daniel aprovou o vídeo da V3.",
    );
    assert.equal(
      describeActivity(t, "Ana", "PROJECT_STATUS_CHANGED", null),
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

    it("registra os eventos essenciais do fluxo da produção", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaActivityRepository } = await import("./activity-prisma.ts");
      const { prismaApprovalRepository } = await import("./approval-prisma.ts");
      const { prismaEditVersionRepository } =
        await import("./edit-version-prisma.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaParticipantRepository } =
        await import("./participant-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaPublicationRepository } =
        await import("./publication-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const deps = {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        versions: prismaEditVersionRepository,
        approvals: prismaApprovalRepository,
        participants: prismaParticipantRepository,
        publications: prismaPublicationRepository,
        activities: prismaActivityRepository,
      };
      const suffix = randomUUID();
      const owner = await prisma.user.create({
        data: { email: `act-flow-${suffix}@example.com`, name: "Ana" },
      });
      let workspaceId = "";
      try {
        workspaceId = (
          await createWorkspace(
            owner.id,
            { name: `Fluxo ${suffix}`, slug: `fluxo-${suffix}` },
            prismaWorkspaceRepository,
          )
        ).workspace.id;
        const project = await createProject(
          owner.id,
          workspaceId,
          { title: `Peça ${suffix}`, format: "DEMO" },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
          prismaProjectRepository,
          prismaActivityRepository,
        );
        await changeVideoProjectStatus(
          owner.id,
          workspaceId,
          project.id,
          { status: "EDITING" },
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaActivityRepository,
        );
        const v1 = await createEditVersion(
          owner.id,
          workspaceId,
          project.id,
          { previewUrl: "https://vimeo.com/1" },
          deps,
        );
        const first = await requestApproval(
          owner.id,
          workspaceId,
          project.id,
          v1.id,
          deps,
        );
        await requestChanges(
          owner.id,
          workspaceId,
          project.id,
          first.id,
          { notes: "trocar música" },
          deps,
        );
        const second = await requestApproval(
          owner.id,
          workspaceId,
          project.id,
          v1.id,
          deps,
        );
        await approveVersion(
          owner.id,
          workspaceId,
          project.id,
          second.id,
          {},
          deps,
        );
        const publication = await prisma.publication.create({
          data: { videoProjectId: project.id, platform: "TIKTOK" },
        });
        await schedulePublication(
          owner.id,
          workspaceId,
          project.id,
          publication.id,
          { scheduledAt: "2026-10-10T18:00:00Z" },
          deps,
        );
        await recordPublicationOutcome(
          owner.id,
          workspaceId,
          project.id,
          publication.id,
          { status: "PUBLISHED" },
          deps,
        );

        const rows = await listProjectActivity(
          owner.id,
          workspaceId,
          project.id,
          deps,
        );
        assert.deepEqual(rows.map((row) => row.action).sort(), [
          "APPROVAL_REQUESTED",
          "APPROVAL_REQUESTED",
          "CHANGES_REQUESTED",
          "PROJECT_CREATED",
          "PROJECT_STATUS_CHANGED",
          // Publicar move a produção para Publicado (ADR-044).
          "PROJECT_STATUS_CHANGED",
          "PUBLICATION_RECORDED",
          "PUBLICATION_SCHEDULED",
          "VERSION_APPROVED",
          "VERSION_CREATED",
        ]);
        const approved = rows.find((row) => row.action === "VERSION_APPROVED");
        assert.ok(approved);
        assert.equal(
          describeActivity(t, "Ana", approved.action, approved.metadata),
          "Ana aprovou o vídeo da V1.",
        );
        const recorded = rows.find(
          (row) => row.action === "PUBLICATION_RECORDED",
        );
        assert.ok(recorded);
        assert.equal(
          describeActivity(t, "Ana", recorded.action, recorded.metadata),
          "Ana registrou a publicação em TikTok.",
        );
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        await prisma.user.deleteMany({ where: { id: owner.id } });
      }
    });
  },
);
