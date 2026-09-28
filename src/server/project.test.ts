import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import type { IdeaRecord, IdeaRepository } from "./idea-repository.ts";
import { projectDraftFromIdea } from "./project-draft.ts";
import {
  convertIdeaToProject,
  createProject,
  deleteProject,
  getProject,
  listProjects,
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
  const ideas: IdeaRecord[] = [];
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

  const ideaRepo: IdeaRepository = {
    async list() {
      return [];
    },
    async find(workspaceId, ideaId) {
      return (
        ideas.find(
          (idea) => idea.id === ideaId && idea.workspaceId === workspaceId,
        ) ?? null
      );
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
    async findBySlug(workspaceId, slug) {
      return (
        projects.find(
          (item) => item.workspaceId === workspaceId && item.slug === slug,
        ) ?? null
      );
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
      Object.assign(project, input, { updatedAt: new Date() });
      return project;
    },
    async findBySourceIdea(workspaceId, ideaId) {
      return (
        projects.find(
          (item) =>
            item.workspaceId === workspaceId && item.sourceIdeaId === ideaId,
        ) ?? null
      );
    },
    async setStatus(workspaceId, projectId, status) {
      const project = projects.find(
        (item) => item.id === projectId && item.workspaceId === workspaceId,
      );
      if (!project) return null;
      project.status = status;
      return project;
    },
    async convert(workspaceId, userId, ideaId) {
      const idea = ideas.find(
        (item) => item.id === ideaId && item.workspaceId === workspaceId,
      );
      if (!idea) throw new NotFoundError();
      if (idea.status === "CONVERTED") {
        throw new ValidationError({ idea: "Esta ideia já foi convertida." });
      }
      idea.status = "CONVERTED";
      return this.create(workspaceId, userId, projectDraftFromIdea(idea));
    },
    async softDelete(workspaceId, projectId) {
      const index = projects.findIndex(
        (item) => item.id === projectId && item.workspaceId === workspaceId,
      );
      if (index < 0) return false;
      projects.splice(index, 1);
      return true;
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

  function idea(id: string, workspaceId: string) {
    ideas.push({
      id,
      workspaceId,
      title: id,
      description: null,
      format: null,
      objective: null,
      product: null,
      audience: null,
      referenceUrl: null,
      notes: null,
      authorId: "member",
      authorName: null,
      status: "NEW",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return { workspaces, ideaRepo, projectRepo, join, idea };
}

describe("rascunho da conversão", () => {
  it("copia os campos da ideia e não escolhe a etapa", () => {
    const draft = projectDraftFromIdea({
      id: "idea-1",
      title: "Título",
      description: "Texto",
      format: null,
      objective: "Ensinar",
      audience: "Time",
      product: "App",
    });
    assert.equal(draft.title, "Título");
    assert.equal(draft.description, "Texto");
    assert.equal(draft.format, "OTHER");
    assert.equal(draft.objective, "Ensinar");
    assert.equal(draft.audience, "Time");
    assert.equal(draft.product, "App");
    assert.equal(draft.sourceIdeaId, "idea-1");
    assert.equal(draft.status, "IDEA");
    assert.equal(draft.aspectRatio, "NINE_SIXTEEN");
    assert.equal(draft.priority, "NORMAL");
  });
});

describe("produção", () => {
  it("nasce no início do pipeline e ignora status enviado pelo cliente", async () => {
    const { workspaces, ideaRepo, projectRepo, join, idea } = harness();
    join("member", "ws-a", "MEMBER");
    join("viewer", "ws-a", "VIEWER");
    join("outsider", "ws-b", "OWNER");
    idea("idea-a", "ws-a");
    idea("idea-b", "ws-b");

    await assert.rejects(
      () =>
        createProject(
          "viewer",
          "ws-a",
          { title: "Não", format: "DEMO" },
          workspaces,
          ideaRepo,
          projectRepo,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );
    await assert.rejects(
      () =>
        createProject(
          "member",
          "ws-a",
          { title: "Fora", format: "DEMO", sourceIdeaId: "idea-b" },
          workspaces,
          ideaRepo,
          projectRepo,
        ),
      (error: unknown) =>
        error instanceof ValidationError &&
        error.fields.sourceIdeaId !== undefined,
    );

    const created = await createProject(
      "member",
      "ws-a",
      {
        title: "Reels",
        format: "TUTORIAL",
        status: "PUBLISHED",
        priority: "HIGH",
        sourceIdeaId: "idea-a",
        ownerId: "member",
        plannedShootDate: "2026-10-01",
      },
      workspaces,
      ideaRepo,
      projectRepo,
    );
    assert.equal(created.status, "IDEA");
    assert.equal(created.createdById, "member");
    assert.equal(created.aspectRatio, "NINE_SIXTEEN");
    assert.equal(created.priority, "HIGH");
    assert.equal(created.sourceIdeaId, "idea-a");
    assert.equal(created.ownerId, "member");
    assert.equal(
      created.plannedShootDate?.toISOString(),
      "2026-10-01T00:00:00.000Z",
    );

    await assert.rejects(
      () =>
        createProject(
          "member",
          "ws-a",
          {
            title: "Thumb",
            format: "DEMO",
            thumbnailUrl: "javascript:alert(1)",
          },
          workspaces,
          ideaRepo,
          projectRepo,
        ),
      (error: unknown) =>
        error instanceof ValidationError &&
        error.fields.thumbnailUrl !== undefined,
    );

    await assert.rejects(
      () => getProject("outsider", "ws-a", created.id, workspaces, projectRepo),
      (error: unknown) => error instanceof ForbiddenError,
    );
    await assert.rejects(
      () => getProject("outsider", "ws-b", created.id, workspaces, projectRepo),
      (error: unknown) => error instanceof NotFoundError,
    );

    const listed = await listProjects(
      "viewer",
      "ws-a",
      workspaces,
      projectRepo,
    );
    assert.equal(
      listed.some((item) => item.id === created.id),
      true,
    );

    const updated = await updateProject(
      "member",
      "ws-a",
      created.id,
      { title: "Reels 2", format: "DEMO", status: "PUBLISHED", slug: "reels" },
      workspaces,
      ideaRepo,
      projectRepo,
    );
    assert.equal(updated.title, "Reels 2");
    assert.equal(updated.status, "IDEA");
    assert.equal(updated.createdById, "member");

    await assert.rejects(
      () =>
        updateProject(
          "viewer",
          "ws-a",
          created.id,
          { title: "Não", format: "DEMO" },
          workspaces,
          ideaRepo,
          projectRepo,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );

    const converted = await convertIdeaToProject(
      "member",
      "ws-a",
      "idea-a",
      workspaces,
      projectRepo,
    );
    assert.equal(converted.sourceIdeaId, "idea-a");
    assert.equal(converted.status, "IDEA");
    assert.equal(converted.title, "idea-a");
    await assert.rejects(
      () =>
        convertIdeaToProject(
          "viewer",
          "ws-a",
          "idea-a",
          workspaces,
          projectRepo,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );
    await assert.rejects(
      () =>
        convertIdeaToProject(
          "member",
          "ws-a",
          "idea-a",
          workspaces,
          projectRepo,
        ),
      (error: unknown) => error instanceof ValidationError,
    );
    await assert.rejects(
      () =>
        convertIdeaToProject(
          "outsider",
          "ws-a",
          "idea-a",
          workspaces,
          projectRepo,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );

    await deleteProject("member", "ws-a", created.id, workspaces, projectRepo);
    const remaining = await listProjects(
      "member",
      "ws-a",
      workspaces,
      projectRepo,
    );
    assert.deepEqual(
      remaining.map((item) => item.id),
      [converted.id],
    );
  });
});
