import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import type { IdeaRepository } from "./idea-repository.ts";
import {
  changeVideoProjectStatus,
  createProject,
  submitBoardMove,
  updateProject,
} from "./project.ts";
import type { ProjectRecord, ProjectRepository } from "./project-repository.ts";
import type {
  MembershipRecord,
  WorkspaceRepository,
  WorkspaceRole,
} from "./workspace-repository.ts";

function harness() {
  const memberships: MembershipRecord[] = [];
  const projects: ProjectRecord[] = [];
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
  };

  const ideas: IdeaRepository = {
    async list() {
      return [];
    },
    async find() {
      return null;
    },
    async create() {
      throw new Error("não usado");
    },
    async update() {
      return null;
    },
    async softDelete() {
      return false;
    },
    async setStatus() {
      return null;
    },
  };

  const projectRepo: ProjectRepository = {
    async list(workspaceId) {
      return projects.filter((item) => item.workspaceId === workspaceId);
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
    async create(workspaceId, createdById, input) {
      const project: ProjectRecord = {
        id: `project-${++sequence}`,
        workspaceId,
        createdById,
        createdAt: new Date(sequence),
        updatedAt: new Date(sequence),
        ...input,
      };
      projects.push(project);
      return project;
    },
    async update(workspaceId, projectId, input) {
      const project = projects.find(
        (item) => item.id === projectId && item.workspaceId === workspaceId,
      );
      if (!project) return null;
      Object.assign(project, input);
      return project;
    },
    async setStatus(workspaceId, projectId, status) {
      const project = projects.find(
        (item) => item.id === projectId && item.workspaceId === workspaceId,
      );
      if (!project) return null;
      project.status = status;
      return project;
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

  function join(userId: string, workspaceId: string, role: WorkspaceRole) {
    memberships.push({
      id: `${workspaceId}-${userId}`,
      workspaceId,
      userId,
      role,
      createdAt: new Date(),
    });
  }

  return { workspaces, ideas, projectRepo, join };
}

describe("etapa da produção", () => {
  it("só o serviço muda a etapa, inclusive pulando o fluxo", async () => {
    const { workspaces, ideas, projectRepo, join } = harness();
    join("owner", "ws-a", "OWNER");
    join("viewer", "ws-a", "VIEWER");
    const created = await createProject(
      "owner",
      "ws-a",
      { title: "Peça", format: "DEMO", status: "PUBLISHED" },
      workspaces,
      ideas,
      projectRepo,
    );
    assert.equal(created.status, "IDEA");

    const edited = await updateProject(
      "owner",
      "ws-a",
      created.id,
      { title: "Peça", format: "DEMO", status: "EDITING" },
      workspaces,
      ideas,
      projectRepo,
    );
    assert.equal(edited.status, "IDEA");

    const published = await changeVideoProjectStatus(
      "owner",
      "ws-a",
      created.id,
      { status: "PUBLISHED" },
      workspaces,
      projectRepo,
    );
    assert.equal(published.status, "PUBLISHED");

    const archived = await changeVideoProjectStatus(
      "owner",
      "ws-a",
      created.id,
      { status: "ARCHIVED" },
      workspaces,
      projectRepo,
    );
    assert.equal(archived.status, "ARCHIVED");

    const again = await changeVideoProjectStatus(
      "owner",
      "ws-a",
      created.id,
      { status: "ARCHIVED" },
      workspaces,
      projectRepo,
    );
    assert.equal(again, archived);

    await assert.rejects(
      () =>
        changeVideoProjectStatus(
          "viewer",
          "ws-a",
          created.id,
          { status: "IDEA" },
          workspaces,
          projectRepo,
        ),
      ForbiddenError,
    );
    await assert.rejects(
      () =>
        changeVideoProjectStatus(
          "outsider",
          "ws-a",
          created.id,
          { status: "IDEA" },
          workspaces,
          projectRepo,
        ),
      ForbiddenError,
    );
    await assert.rejects(
      () =>
        changeVideoProjectStatus(
          "owner",
          "ws-a",
          created.id,
          { status: "NOPE" },
          workspaces,
          projectRepo,
        ),
      ValidationError,
    );
    await assert.rejects(
      () =>
        changeVideoProjectStatus(
          "owner",
          "ws-a",
          "missing",
          { status: "IDEA" },
          workspaces,
          projectRepo,
        ),
      NotFoundError,
    );
    assert.equal(archived.status, "ARCHIVED");
  });

  it("o arraste usa o workspace da sessão e ignora o id enviado no card", async () => {
    const { workspaces, ideas, projectRepo, join } = harness();
    join("owner", "ws-a", "OWNER");
    join("owner", "ws-b", "OWNER");
    join("viewer", "ws-a", "VIEWER");
    const created = await createProject(
      "owner",
      "ws-a",
      { title: "Peça", format: "DEMO" },
      workspaces,
      ideas,
      projectRepo,
    );
    const moved = await submitBoardMove(
      "owner",
      "ws-a",
      { projectId: created.id, status: "EDITING", workspaceId: "ws-b" },
      workspaces,
      projectRepo,
    );
    assert.equal(moved.workspaceId, "ws-a");
    assert.equal(moved.status, "EDITING");
    await assert.rejects(
      () =>
        submitBoardMove(
          "viewer",
          "ws-a",
          { projectId: created.id, status: "PUBLISHED", workspaceId: "ws-a" },
          workspaces,
          projectRepo,
        ),
      ForbiddenError,
    );
    assert.equal(
      (await projectRepo.find("ws-a", created.id))?.status,
      "EDITING",
    );
  });

  it("entra em pronto para gravar mesmo sem cena pronta", async () => {
    const { workspaces, ideas, projectRepo, join } = harness();
    join("owner", "ws-a", "OWNER");
    const created = await createProject(
      "owner",
      "ws-a",
      { title: "Peça", format: "DEMO" },
      workspaces,
      ideas,
      projectRepo,
    );
    const moved = await submitBoardMove(
      "owner",
      "ws-a",
      { projectId: created.id, status: "READY_TO_RECORD" },
      workspaces,
      projectRepo,
    );
    assert.equal(moved.status, "READY_TO_RECORD");
    assert.equal(moved.workspaceId, "ws-a");
  });

  it("recusa gravação que troca o workspace", async () => {
    const { workspaces, ideas, projectRepo, join } = harness();
    join("owner", "ws-a", "OWNER");
    const created = await createProject(
      "owner",
      "ws-a",
      { title: "Peça", format: "DEMO" },
      workspaces,
      ideas,
      projectRepo,
    );
    projectRepo.setStatus = async () => ({
      ...created,
      workspaceId: "ws-b",
      status: "EDITING",
    });
    await assert.rejects(
      () =>
        changeVideoProjectStatus(
          "owner",
          "ws-a",
          created.id,
          { status: "EDITING" },
          workspaces,
          projectRepo,
        ),
      NotFoundError,
    );
  });
});
