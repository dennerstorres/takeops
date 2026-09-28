import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenError } from "./errors.ts";
import { listTeam, roleLabel } from "./team.ts";
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
