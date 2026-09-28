import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenError, ValidationError } from "./errors.ts";
import { changeMemberRole, listTeam, roleLabel } from "./team.ts";
import type {
  MembershipRecord,
  TeamMemberRecord,
  WorkspaceRecord,
  WorkspaceRepository,
  WorkspaceWithMembership,
} from "./workspace-repository.ts";

function repository(members: TeamMemberRecord[]): WorkspaceRepository {
  const memberships: MembershipRecord[] = members.map((member) => ({
    id: member.userId,
    workspaceId: member.workspaceId,
    userId: member.userId,
    role: member.role,
    createdAt: member.joinedAt,
  }));

  return {
    async createWorkspaceWithOwner(): Promise<WorkspaceWithMembership> {
      throw new Error("não usado");
    },
    async findMembership(userId, workspaceId) {
      return (
        memberships.find(
          (item) => item.userId === userId && item.workspaceId === workspaceId,
        ) ?? null
      );
    },
    async findWorkspace(): Promise<WorkspaceRecord | null> {
      return null;
    },
    async listForUser() {
      return [];
    },
    async listMembers(workspaceId) {
      return members.filter((member) => member.workspaceId === workspaceId);
    },
    async updateMemberRole() {
      throw new Error("não usado");
    },
  };
}

describe("listTeam", () => {
  it("mostra só o workspace autorizado, na ordem dos papéis", async () => {
    const joinedAt = new Date("2026-09-28T12:00:00.000Z");
    const members = repository([
      {
        userId: "viewer",
        workspaceId: "ws-a",
        name: "Vera",
        email: "vera@example.com",
        image: "https://cdn.example/vera.png",
        role: "VIEWER",
        joinedAt,
      },
      {
        userId: "owner",
        workspaceId: "ws-a",
        name: "Otto",
        email: "otto@example.com",
        image: "javascript:alert(1)",
        role: "OWNER",
        joinedAt,
      },
      {
        userId: "stranger",
        workspaceId: "ws-b",
        name: "Outro",
        email: "outro@example.com",
        image: null,
        role: "OWNER",
        joinedAt,
      },
    ]);

    const listed = await listTeam("viewer", "ws-a", members);
    assert.deepEqual(
      listed.map((member) => member.userId),
      ["owner", "viewer"],
    );
    assert.equal(listed[0]?.image, null);
    assert.equal(listed[1]?.image, "https://cdn.example/vera.png");
    assert.equal(roleLabel("MEMBER"), "Membro");

    await assert.rejects(
      () => listTeam("viewer", "ws-b", members),
      (error: unknown) => error instanceof ForbiddenError,
    );
  });
});

function roleRepository() {
  const memberships: MembershipRecord[] = [];
  const repository: WorkspaceRepository = {
    async createWorkspaceWithOwner(): Promise<WorkspaceWithMembership> {
      throw new Error("não usado");
    },
    async findMembership(userId, workspaceId) {
      return (
        memberships.find(
          (item) => item.userId === userId && item.workspaceId === workspaceId,
        ) ?? null
      );
    },
    async findWorkspace(): Promise<WorkspaceRecord | null> {
      return null;
    },
    async listForUser() {
      return [];
    },
    async listMembers() {
      return [];
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

  function add(
    userId: string,
    workspaceId: string,
    role: MembershipRecord["role"],
  ) {
    memberships.push({
      id: `${workspaceId}-${userId}`,
      workspaceId,
      userId,
      role,
      createdAt: new Date(),
    });
  }

  return { repository, memberships, add };
}

describe("alteração de papel", () => {
  it("deixa o dono mudar os outros e impede membro, leitor e o próprio papel", async () => {
    const { repository, memberships, add } = roleRepository();
    add("owner", "ws-a", "OWNER");
    add("admin", "ws-a", "ADMIN");
    add("member", "ws-a", "MEMBER");
    add("viewer", "ws-a", "VIEWER");
    add("outsider", "ws-b", "MEMBER");

    await assert.rejects(
      () =>
        changeMemberRole(
          "owner",
          "ws-a",
          { userId: "admin", role: "OWNER" },
          repository,
        ),
      (error: unknown) => error instanceof ValidationError,
    );
    await assert.rejects(
      () =>
        changeMemberRole(
          "owner",
          "ws-a",
          { userId: "owner", role: "ADMIN" },
          repository,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );
    await assert.rejects(
      () =>
        changeMemberRole(
          "owner",
          "ws-a",
          { userId: "outsider", role: "VIEWER" },
          repository,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );
    await assert.rejects(
      () =>
        changeMemberRole(
          "member",
          "ws-a",
          { userId: "viewer", role: "MEMBER" },
          repository,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );
    await assert.rejects(
      () =>
        changeMemberRole(
          "viewer",
          "ws-a",
          { userId: "member", role: "VIEWER" },
          repository,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );

    const changed = await changeMemberRole(
      "owner",
      "ws-a",
      { userId: "member", role: "ADMIN" },
      repository,
    );
    assert.equal(changed.role, "ADMIN");
    assert.equal(
      memberships.find((item) => item.userId === "outsider")?.role,
      "MEMBER",
    );
  });

  it("deixa o admin mudar só membro e leitor", async () => {
    const { repository, memberships, add } = roleRepository();
    add("owner", "ws-a", "OWNER");
    add("admin", "ws-a", "ADMIN");
    add("other-admin", "ws-a", "ADMIN");
    add("viewer", "ws-a", "VIEWER");

    const changed = await changeMemberRole(
      "admin",
      "ws-a",
      { userId: "viewer", role: "MEMBER" },
      repository,
    );
    assert.equal(changed.role, "MEMBER");
    assert.equal(
      memberships.find((item) => item.userId === "viewer")?.role,
      "MEMBER",
    );

    await assert.rejects(
      () =>
        changeMemberRole(
          "admin",
          "ws-a",
          { userId: "other-admin", role: "MEMBER" },
          repository,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );
    await assert.rejects(
      () =>
        changeMemberRole(
          "admin",
          "ws-a",
          { userId: "owner", role: "MEMBER" },
          repository,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );
    assert.equal(
      memberships.find((item) => item.userId === "owner")?.role,
      "OWNER",
    );
  });
});
