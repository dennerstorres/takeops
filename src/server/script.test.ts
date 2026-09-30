import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import type { ProjectRecord, ProjectRepository } from "./project-repository.ts";
import { getScript, saveScript } from "./script.ts";
import type { ScriptRecord, ScriptRepository } from "./script-repository.ts";
import type {
  MembershipRecord,
  WorkspaceRepository,
  WorkspaceRole,
} from "./workspace-repository.ts";

function project(id: string, workspaceId: string): ProjectRecord {
  return {
    id,
    workspaceId,
    title: id,
    slug: null,
    description: null,
    objective: null,
    audience: null,
    product: null,
    format: "DEMO",
    aspectRatio: "NINE_SIXTEEN",
    estimatedDurationSeconds: null,
    status: "IDEA",
    priority: "NORMAL",
    thumbnailUrl: null,
    ownerId: null,
    plannedShootDate: null,
    plannedPublishDate: null,
    sourceIdeaId: null,
    createdById: "owner",
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-01T00:00:00.000Z"),
  };
}

function harness() {
  const memberships: MembershipRecord[] = [];
  const projects = [project("p-a", "ws-a"), project("p-b", "ws-b")];
  const scripts: ScriptRecord[] = [];
  let sequence = 0;

  const workspaces: WorkspaceRepository = {
    async createWorkspaceWithOwner() {
      throw new Error("não usado");
    },
    async findMembership(userId, workspaceId) {
      return (
        memberships.find(
          (item) => item.userId === userId && item.workspaceId === workspaceId,
        ) ?? null
      );
    },
    async findWorkspace() {
      return null;
    },
    async listForUser() {
      return [];
    },
    async listMembers() {
      return [];
    },
    async updateMemberRole() {
      throw new Error("não usado");
    },
    async updateWorkspace() {
      return null;
    },
    async removeMember() {
      return false;
    },
  };

  const projectRepo: ProjectRepository = {
    async list() {
      return [];
    },
    async find(workspaceId, projectId) {
      return (
        projects.find(
          (item) => item.id === projectId && item.workspaceId === workspaceId,
        ) ?? null
      );
    },
    async findBySlug() {
      return null;
    },
    async create() {
      throw new Error("não usado");
    },
    async update() {
      return null;
    },
    async setStatus() {
      return null;
    },
    async softDelete() {
      return false;
    },
    async findBySourceIdea() {
      return null;
    },
    async convert() {
      throw new Error("não usado");
    },
  };

  const scriptRepo: ScriptRepository = {
    async find(workspaceId, projectId) {
      const project = projects.find(
        (item) => item.id === projectId && item.workspaceId === workspaceId,
      );
      if (!project) return null;
      return scripts.find((item) => item.videoProjectId === project.id) ?? null;
    },
    async save(workspaceId, projectId, input) {
      const project = projects.find(
        (item) => item.id === projectId && item.workspaceId === workspaceId,
      );
      if (!project) return null;
      const current = scripts.find((item) => item.videoProjectId === project.id);
      if (current) {
        Object.assign(current, input, { updatedAt: new Date() });
        return current;
      }
      const created: ScriptRecord = {
        id: `script-${++sequence}`,
        videoProjectId: project.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...input,
      };
      scripts.push(created);
      return created;
    },
  };

  function join(userId: string, workspaceId: string, role: WorkspaceRole) {
    memberships.push({
      id: `${workspaceId}-${userId}`,
      workspaceId,
      userId,
      role,
      createdAt: new Date(),
    });
  }

  return { workspaces, projectRepo, scriptRepo, join };
}

describe("roteiro", () => {
  it("grava um roteiro por produção e ignora workspace no corpo", async () => {
    const { workspaces, projectRepo, scriptRepo, join } = harness();
    join("owner", "ws-a", "OWNER");
    join("viewer", "ws-a", "VIEWER");
    const saved = await saveScript(
      "owner",
      "ws-a",
      "p-a",
      {
        hook: "  Abre com a dor  ",
        mainMessage: "Mostra o produto",
        cta: "Compre",
        notes: "",
        workspaceId: "ws-b",
      },
      workspaces,
      projectRepo,
      scriptRepo,
    );
    assert.equal(saved.videoProjectId, "p-a");
    assert.equal(saved.hook, "Abre com a dor");
    assert.equal(saved.notes, null);

    const again = await saveScript(
      "owner",
      "ws-a",
      "p-a",
      { hook: "Novo gancho" },
      workspaces,
      projectRepo,
      scriptRepo,
    );
    assert.equal(again.id, saved.id);
    assert.equal(again.hook, "Novo gancho");
    assert.equal(again.mainMessage, "Mostra o produto");

    const read = await getScript(
      "viewer",
      "ws-a",
      "p-a",
      workspaces,
      projectRepo,
      scriptRepo,
    );
    assert.equal(read?.hook, "Novo gancho");

    await assert.rejects(
      () =>
        saveScript(
          "viewer",
          "ws-a",
          "p-a",
          { hook: "Não" },
          workspaces,
          projectRepo,
          scriptRepo,
        ),
      ForbiddenError,
    );
    await assert.rejects(
      () =>
        getScript("outsider", "ws-a", "p-a", workspaces, projectRepo, scriptRepo),
      ForbiddenError,
    );
    await assert.rejects(
      () =>
        getScript("owner", "ws-a", "p-b", workspaces, projectRepo, scriptRepo),
      NotFoundError,
    );
    await assert.rejects(
      () =>
        saveScript(
          "owner",
          "ws-a",
          "p-a",
          { hook: "x".repeat(2001) },
          workspaces,
          projectRepo,
          scriptRepo,
        ),
      ValidationError,
    );
    assert.equal(
      (await getScript("owner", "ws-a", "p-a", workspaces, projectRepo, scriptRepo))
        ?.hook,
      "Novo gancho",
    );
  });

  it("recusa gravação que troca a produção", async () => {
    const { workspaces, projectRepo, scriptRepo, join } = harness();
    join("owner", "ws-a", "OWNER");
    scriptRepo.save = async () => ({
      id: "errado",
      videoProjectId: "p-b",
      hook: null,
      mainMessage: null,
      cta: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await assert.rejects(
      () =>
        saveScript(
          "owner",
          "ws-a",
          "p-a",
          { hook: "Gancho" },
          workspaces,
          projectRepo,
          scriptRepo,
        ),
      NotFoundError,
    );
  });
});
