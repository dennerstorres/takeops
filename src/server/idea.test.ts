import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import type {
  IdeaRecord,
  IdeaRepository,
  IdeaWrite,
} from "./idea-repository.ts";
import {
  changeIdeaStatus,
  createIdea,
  deleteIdea,
  getIdea,
  listIdeas,
  updateIdea,
} from "./idea.ts";
import type {
  MembershipRecord,
  WorkspaceRepository,
  WorkspaceRole,
} from "./workspace-repository.ts";

function harness() {
  const memberships: MembershipRecord[] = [];
  const ideas: IdeaRecord[] = [];
  const names = new Map<string, string>();
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

  const ideaRepo: IdeaRepository = {
    async list(workspaceId) {
      return ideas
        .filter((idea) => idea.workspaceId === workspaceId)
        .sort(
          (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
        );
    },
    async find(workspaceId, ideaId) {
      return (
        ideas.find(
          (idea) => idea.id === ideaId && idea.workspaceId === workspaceId,
        ) ?? null
      );
    },
    async create(workspaceId, authorId, input: IdeaWrite) {
      const idea: IdeaRecord = {
        id: `idea-${++sequence}`,
        workspaceId,
        authorId,
        authorName: names.get(authorId) ?? null,
        status: "NEW",
        createdAt: new Date(sequence),
        updatedAt: new Date(sequence),
        ...input,
      };
      ideas.push(idea);
      return idea;
    },
    async update(workspaceId, ideaId, input) {
      const idea = ideas.find(
        (item) => item.id === ideaId && item.workspaceId === workspaceId,
      );
      if (!idea) return null;
      Object.assign(idea, input, { updatedAt: new Date() });
      return idea;
    },
    async setStatus(workspaceId, ideaId, status) {
      const idea = ideas.find(
        (item) => item.id === ideaId && item.workspaceId === workspaceId,
      );
      if (!idea) return null;
      idea.status = status;
      return idea;
    },
    async softDelete(workspaceId, ideaId) {
      const index = ideas.findIndex(
        (item) => item.id === ideaId && item.workspaceId === workspaceId,
      );
      if (index < 0) return false;
      ideas.splice(index, 1);
      return true;
    },
  };

  function join(
    userId: string,
    workspaceId: string,
    role: WorkspaceRole,
    name: string,
  ) {
    names.set(userId, name);
    memberships.push({
      id: `${workspaceId}-${userId}`,
      workspaceId,
      userId,
      role,
      createdAt: new Date(),
    });
  }

  return { workspaces, ideaRepo, ideas, join };
}

describe("ideias", () => {
  it("grava o autor da sessão e não aceita status nem URL insegura", async () => {
    const { workspaces, ideaRepo, join } = harness();
    join("member", "ws-a", "MEMBER", "Membro");
    join("viewer", "ws-a", "VIEWER", "Leitor");
    join("outsider", "ws-b", "OWNER", "Fora");

    await assert.rejects(
      () =>
        createIdea("viewer", "ws-a", { title: "Não" }, workspaces, ideaRepo),
      (error: unknown) => error instanceof ForbiddenError,
    );
    await assert.rejects(
      () =>
        createIdea(
          "member",
          "ws-a",
          { title: "Link", referenceUrl: "javascript:alert(1)" },
          workspaces,
          ideaRepo,
        ),
      (error: unknown) =>
        error instanceof ValidationError &&
        error.fields.referenceUrl !== undefined,
    );

    const created = await createIdea(
      "member",
      "ws-a",
      {
        title: "  Tutorial  ",
        description: "  ",
        status: "CONVERTED",
        authorId: "outsider",
      },
      workspaces,
      ideaRepo,
    );
    assert.equal(created.title, "Tutorial");
    assert.equal(created.description, null);
    assert.equal(created.authorId, "member");
    assert.equal(created.status, "NEW");

    const updated = await updateIdea(
      "member",
      "ws-a",
      created.id,
      { title: "Novo título", status: "APPROVED" },
      workspaces,
      ideaRepo,
    );
    assert.equal(updated.title, "Novo título");
    assert.equal(updated.status, "NEW");
    assert.equal(updated.authorId, "member");

    await assert.rejects(
      () => getIdea("outsider", "ws-b", created.id, workspaces, ideaRepo),
      (error: unknown) => error instanceof NotFoundError,
    );
    await assert.rejects(
      () => getIdea("outsider", "ws-a", created.id, workspaces, ideaRepo),
      (error: unknown) => error instanceof ForbiddenError,
    );

    await deleteIdea("member", "ws-a", created.id, workspaces, ideaRepo);
    const listed = await listIdeas("viewer", "ws-a", workspaces, ideaRepo);
    assert.equal(listed.length, 0);
    await assert.rejects(
      () => getIdea("member", "ws-a", created.id, workspaces, ideaRepo),
      (error: unknown) => error instanceof NotFoundError,
    );
  });
});

describe("captura rápida", () => {
  it("grava a ideia só com o título", async () => {
    const { workspaces, ideaRepo, join } = harness();
    join("member", "ws-a", "MEMBER", "Membro");

    const created = await createIdea(
      "member",
      "ws-a",
      { title: "Só o título" },
      workspaces,
      ideaRepo,
    );

    assert.equal(created.title, "Só o título");
    assert.equal(created.description, null);
    assert.equal(created.format, null);
    assert.equal(created.referenceUrl, null);
    assert.equal(created.status, "NEW");
    assert.equal(created.authorId, "member");
  });
});

describe("status da ideia", () => {
  it("só move entre os quatro status livres", async () => {
    const { workspaces, ideaRepo, ideas, join } = harness();
    join("member", "ws-a", "MEMBER", "Membro");
    join("viewer", "ws-a", "VIEWER", "Leitor");
    join("outsider", "ws-b", "OWNER", "Fora");
    const created = await createIdea(
      "member",
      "ws-a",
      { title: "Status" },
      workspaces,
      ideaRepo,
    );

    for (const status of [
      "UNDER_REVIEW",
      "APPROVED",
      "DISCARDED",
      "NEW",
    ] as const) {
      const changed = await changeIdeaStatus(
        "member",
        "ws-a",
        created.id,
        { status },
        workspaces,
        ideaRepo,
      );
      assert.equal(changed.status, status);
    }

    await assert.rejects(
      () =>
        changeIdeaStatus(
          "viewer",
          "ws-a",
          created.id,
          { status: "APPROVED" },
          workspaces,
          ideaRepo,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );
    await assert.rejects(
      () =>
        changeIdeaStatus(
          "outsider",
          "ws-a",
          created.id,
          { status: "DISCARDED" },
          workspaces,
          ideaRepo,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );
    await assert.rejects(
      () =>
        changeIdeaStatus(
          "member",
          "ws-a",
          created.id,
          { status: "CONVERTED" },
          workspaces,
          ideaRepo,
        ),
      (error: unknown) => error instanceof ValidationError,
    );
    await assert.rejects(
      () =>
        changeIdeaStatus(
          "member",
          "ws-a",
          created.id,
          { status: "PUBLICADO" },
          workspaces,
          ideaRepo,
        ),
      (error: unknown) => error instanceof ValidationError,
    );
    assert.equal(ideas.find((idea) => idea.id === created.id)?.status, "NEW");

    const stored = ideas.find((idea) => idea.id === created.id);
    if (!stored) throw new Error("ideia sumiu");
    stored.status = "CONVERTED";
    await assert.rejects(
      () =>
        changeIdeaStatus(
          "member",
          "ws-a",
          created.id,
          { status: "NEW" },
          workspaces,
          ideaRepo,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );
    assert.equal(stored.status, "CONVERTED");
  });
});
