import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError, ValidationError } from "./errors.ts";
import {
  createWorkspace,
  decideFirstAccess,
  getWorkspace,
  listWorkspaces,
  requireRole,
  slugifyWorkspaceName,
} from "./workspace.ts";
import {
  DuplicateSlugError,
  type CreateWorkspaceData,
  type MembershipRecord,
  type WorkspaceRecord,
  type WorkspaceRepository,
  type WorkspaceWithMembership,
} from "./workspace-repository.ts";

function memoryRepository(): WorkspaceRepository {
  const workspaces = new Map<string, WorkspaceRecord>();
  const memberships: MembershipRecord[] = [];

  return {
    async createWorkspaceWithOwner(input: CreateWorkspaceData) {
      if ([...workspaces.values()].some((item) => item.slug === input.slug)) {
        throw new DuplicateSlugError();
      }
      const now = new Date();
      const workspace: WorkspaceRecord = {
        id: randomUUID(),
        name: input.name,
        slug: input.slug,
        logoUrl: input.logoUrl,
        timezone: input.timezone,
        createdAt: now,
        updatedAt: now,
      };
      const membership: MembershipRecord = {
        id: randomUUID(),
        workspaceId: workspace.id,
        userId: input.userId,
        role: "OWNER",
        createdAt: now,
      };
      workspaces.set(workspace.id, workspace);
      memberships.push(membership);
      return { workspace, membership };
    },
    async findMembership(userId, workspaceId) {
      return (
        memberships.find(
          (item) => item.userId === userId && item.workspaceId === workspaceId,
        ) ?? null
      );
    },
    async findWorkspace(workspaceId) {
      return workspaces.get(workspaceId) ?? null;
    },
    async listForUser(userId) {
      return memberships.flatMap((membership) => {
        if (membership.userId !== userId) return [];
        const workspace = workspaces.get(membership.workspaceId);
        return workspace ? [{ workspace, membership }] : [];
      });
    },
    async listMembers(workspaceId) {
      return memberships
        .filter((membership) => membership.workspaceId === workspaceId)
        .map((membership) => ({
          userId: membership.userId,
          workspaceId: membership.workspaceId,
          name: null,
          email: null,
          image: null,
          role: membership.role,
          joinedAt: membership.createdAt,
        }));
    },
    async updateMemberRole(workspaceId, userId, role) {
      const membership = memberships.find(
        (item) => item.userId === userId && item.workspaceId === workspaceId,
      );
      if (!membership) return null;
      membership.role = role;
      return membership;
    },
  };
}

async function ownedWorkspace(
  repository: WorkspaceRepository,
  userId: string,
  name: string,
): Promise<WorkspaceWithMembership> {
  return createWorkspace(userId, { name }, repository);
}

describe("slug do workspace", () => {
  it("normaliza acento e espaço", () => {
    assert.equal(slugifyWorkspaceName("Açaí Vídeo"), "acai-video");
  });
});

describe("membership", () => {
  it("cria o workspace com o autor como OWNER", async () => {
    const repository = memoryRepository();
    const created = await createWorkspace(
      "user-a",
      { name: "Acme Software", logoUrl: "https://example.com/logo.png" },
      repository,
    );

    assert.equal(created.workspace.slug, "acme-software");
    assert.equal(created.workspace.timezone, "America/Cuiaba");
    assert.equal(created.membership.role, "OWNER");
    assert.equal(created.membership.userId, "user-a");
  });

  it("lista só os workspaces do usuário", async () => {
    const repository = memoryRepository();
    const own = await ownedWorkspace(repository, "user-a", "Time A");
    await ownedWorkspace(repository, "user-b", "Time B");

    const listed = await listWorkspaces("user-a", repository);
    assert.deepEqual(
      listed.map((item) => item.workspace.id),
      [own.workspace.id],
    );
  });

  it("bloqueia leitura de workspace alheio", async () => {
    const repository = memoryRepository();
    const other = await ownedWorkspace(repository, "user-b", "Time B");

    await assert.rejects(
      () => getWorkspace("user-a", other.workspace.id, repository),
      (error: unknown) => error instanceof ForbiddenError,
    );
    await assert.rejects(
      () => requireRole("user-a", other.workspace.id, ["OWNER"], repository),
      (error: unknown) => error instanceof ForbiddenError,
    );
  });

  it("recusa papel insuficiente dentro do próprio workspace", async () => {
    const repository = memoryRepository();
    const own = await ownedWorkspace(repository, "user-a", "Time A");
    const membership = await repository.findMembership(
      "user-a",
      own.workspace.id,
    );
    assert.ok(membership);
    membership.role = "VIEWER";

    await assert.rejects(
      () =>
        requireRole("user-a", own.workspace.id, ["OWNER", "ADMIN"], repository),
      (error: unknown) => error instanceof ForbiddenError,
    );
  });

  it("recusa slug repetido, fuso inválido e URL que não é http", async () => {
    const repository = memoryRepository();
    await createWorkspace("user-a", { name: "Acme", slug: "acme" }, repository);

    await assert.rejects(
      () =>
        createWorkspace("user-b", { name: "Outro", slug: "acme" }, repository),
      (error: unknown) =>
        error instanceof ValidationError && error.fields.slug !== undefined,
    );
    await assert.rejects(
      () =>
        createWorkspace(
          "user-a",
          { name: "Acme 2", timezone: "Nao/Existe" },
          repository,
        ),
      (error: unknown) =>
        error instanceof ValidationError && error.fields.timezone !== undefined,
    );
    await assert.rejects(
      () =>
        createWorkspace(
          "user-a",
          { name: "Acme 3", logoUrl: "javascript:alert(1)" },
          repository,
        ),
      (error: unknown) =>
        error instanceof ValidationError && error.fields.logoUrl !== undefined,
    );
  });
});

describe("primeiro acesso", () => {
  it("pede criação quando não há membership e abre a mais antiga", async () => {
    const repository = memoryRepository();
    assert.deepEqual(decideFirstAccess("user-a", []), { kind: "setup" });

    const older = await createWorkspace(
      "user-a",
      { name: "Antigo" },
      repository,
    );
    const newer = await createWorkspace("user-a", { name: "Novo" }, repository);
    const listed = await listWorkspaces("user-a", repository);
    const access = decideFirstAccess("user-a", listed);

    assert.equal(access.kind, "enter");
    if (access.kind === "enter") {
      assert.equal(access.workspace.workspace.id, older.workspace.id);
      assert.notEqual(access.workspace.workspace.id, newer.workspace.id);
    }

    const foreign = decideFirstAccess("user-b", listed);
    assert.deepEqual(foreign, { kind: "setup" });
  });
});
