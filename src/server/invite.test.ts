import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import type { InviteRecord, InviteRepository } from "./invite-repository.ts";
import {
  acceptInviteToken,
  claimEmailInvites,
  createInvite,
  hashInviteToken,
  listInvites,
  revokeInvite,
} from "./invite.ts";
import type {
  MembershipRecord,
  WorkspaceRepository,
  WorkspaceRole,
} from "./workspace-repository.ts";

function harness() {
  const memberships: MembershipRecord[] = [];
  const emails = new Map<string, string>();
  const invites: InviteRecord[] = [];
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
  };

  const inviteRepo: InviteRepository = {
    async findUser(userId) {
      const email = emails.get(userId);
      return email === undefined ? null : { id: userId, email };
    },
    async memberHasEmail(workspaceId, email) {
      return memberships.some(
        (item) =>
          item.workspaceId === workspaceId && emails.get(item.userId) === email,
      );
    },
    async findPending(workspaceId, email) {
      return (
        invites.find(
          (item) =>
            item.workspaceId === workspaceId &&
            item.email === email &&
            item.status === "PENDING",
        ) ?? null
      );
    },
    async create(input) {
      const invite: InviteRecord = {
        id: `invite-${++sequence}`,
        status: "PENDING",
        acceptedById: null,
        createdAt: new Date(sequence),
        ...input,
      };
      invites.push(invite);
      return invite;
    },
    async listByWorkspace(workspaceId) {
      return invites.filter((item) => item.workspaceId === workspaceId);
    },
    async listPendingByEmail(email) {
      return invites
        .filter((item) => item.email === email && item.status === "PENDING")
        .sort(
          (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
        );
    },
    async findByTokenHash(tokenHash) {
      return invites.find((item) => item.tokenHash === tokenHash) ?? null;
    },
    async accept(inviteId, userId, email) {
      const invite = invites.find((item) => item.id === inviteId);
      if (!invite || invite.email !== email) throw new ForbiddenError();
      if (invite.status !== "PENDING" || invite.expiresAt <= new Date()) {
        throw new NotFoundError("Convite inválido ou expirado.");
      }
      const existing = memberships.find(
        (item) =>
          item.userId === userId && item.workspaceId === invite.workspaceId,
      );
      if (!existing) {
        memberships.push({
          id: `member-${userId}`,
          workspaceId: invite.workspaceId,
          userId,
          role: invite.role,
          createdAt: new Date(),
        });
      }
      invite.status = "ACCEPTED";
      invite.acceptedById = userId;
      return invite;
    },
    async revoke(inviteId, workspaceId) {
      const invite = invites.find(
        (item) => item.id === inviteId && item.workspaceId === workspaceId,
      );
      if (!invite || invite.status !== "PENDING") return null;
      invite.status = "REVOKED";
      return invite;
    },
  };

  function join(
    userId: string,
    workspaceId: string,
    role: WorkspaceRole,
    email: string,
  ) {
    emails.set(userId, email);
    memberships.push({
      id: userId,
      workspaceId,
      userId,
      role,
      createdAt: new Date(),
    });
  }

  return { workspaces, inviteRepo, memberships, invites, join };
}

describe("convites", () => {
  it("grava o papel no convite e só aceita o e-mail convidado", async () => {
    const { workspaces, inviteRepo, memberships, invites, join } = harness();
    join("owner", "ws-a", "OWNER", "owner@example.com");
    join("member", "ws-a", "MEMBER", "member@example.com");

    await assert.rejects(
      () =>
        createInvite(
          "member",
          "ws-a",
          { email: "nova@example.com", role: "MEMBER" },
          workspaces,
          inviteRepo,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );

    await assert.rejects(
      () =>
        createInvite(
          "owner",
          "ws-a",
          { email: "admin@example.com", role: "OWNER" },
          workspaces,
          inviteRepo,
        ),
      (error: unknown) => error instanceof ValidationError,
    );

    const created = await createInvite(
      "owner",
      "ws-a",
      { email: "Nova@Example.com", role: "VIEWER" },
      workspaces,
      inviteRepo,
    );
    assert.equal(created.invite.role, "VIEWER");
    assert.equal(created.invite.email, "nova@example.com");
    assert.equal(invites[0]?.tokenHash, hashInviteToken(created.token));
    assert.notEqual(invites[0]?.tokenHash, created.token);

    inviteRepo.findUser = async (userId) =>
      userId === "guest"
        ? { id: "guest", email: "outra@example.com" }
        : { id: userId, email: "nova@example.com" };

    await assert.rejects(
      () => acceptInviteToken("guest", created.token, inviteRepo),
      (error: unknown) => error instanceof ForbiddenError,
    );
    assert.equal(
      memberships.some((item) => item.userId === "guest"),
      false,
    );

    const accepted = await acceptInviteToken("nova", created.token, inviteRepo);
    assert.equal(accepted.role, "VIEWER");
    assert.equal(
      memberships.find((item) => item.userId === "nova")?.role,
      "VIEWER",
    );
  });

  it("não troca o papel de quem já participa e não aceita convite expirado", async () => {
    const { workspaces, inviteRepo, memberships, join } = harness();
    join("owner", "ws-a", "OWNER", "owner@example.com");

    const created = await createInvite(
      "owner",
      "ws-a",
      { email: "admin@example.com", role: "VIEWER" },
      workspaces,
      inviteRepo,
    );
    join("admin", "ws-a", "ADMIN", "admin@example.com");
    inviteRepo.findUser = async () => ({
      id: "admin",
      email: "admin@example.com",
    });
    await acceptInviteToken("admin", created.token, inviteRepo);
    assert.equal(
      memberships.find((item) => item.userId === "admin")?.role,
      "ADMIN",
    );

    const expired = await createInvite(
      "owner",
      "ws-a",
      { email: "tarde@example.com", role: "MEMBER" },
      workspaces,
      inviteRepo,
      new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    );
    inviteRepo.findUser = async () => ({
      id: "tarde",
      email: "tarde@example.com",
    });
    await assert.rejects(
      () => acceptInviteToken("tarde", expired.token, inviteRepo),
      (error: unknown) => error instanceof NotFoundError,
    );
  });

  it("no primeiro acesso entra pelos convites do e-mail, sem papel vindo de fora", async () => {
    const { workspaces, inviteRepo, memberships, join } = harness();
    join("owner", "ws-a", "OWNER", "owner@example.com");
    const created = await createInvite(
      "owner",
      "ws-a",
      { email: "pessoa@example.com", role: "MEMBER" },
      workspaces,
      inviteRepo,
    );
    inviteRepo.findUser = async () => ({
      id: "pessoa",
      email: "pessoa@example.com",
    });

    const claimed = await claimEmailInvites("pessoa", inviteRepo);
    assert.equal(claimed.length, 1);
    assert.equal(claimed[0]?.role, "MEMBER");
    assert.equal(
      memberships.find((item) => item.userId === "pessoa")?.role,
      "MEMBER",
    );
    assert.equal(created.invite.status, "ACCEPTED");

    await assert.rejects(
      () => listInvites("pessoa", "ws-b", workspaces, inviteRepo),
      (error: unknown) => error instanceof ForbiddenError,
    );
  });

  it("admin não revoga convite de admin", async () => {
    const { workspaces, inviteRepo, join } = harness();
    join("owner", "ws-a", "OWNER", "owner@example.com");
    join("admin", "ws-a", "ADMIN", "admin@example.com");
    await assert.rejects(
      () =>
        createInvite(
          "admin",
          "ws-a",
          { email: "chefe@example.com", role: "ADMIN" },
          workspaces,
          inviteRepo,
        ),
      (error: unknown) => error instanceof ValidationError,
    );
    const created = await createInvite(
      "owner",
      "ws-a",
      { email: "chefe@example.com", role: "ADMIN" },
      workspaces,
      inviteRepo,
    );

    await assert.rejects(
      () =>
        revokeInvite(
          "admin",
          "ws-a",
          created.invite.id,
          workspaces,
          inviteRepo,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );

    const revoked = await revokeInvite(
      "owner",
      "ws-a",
      created.invite.id,
      workspaces,
      inviteRepo,
    );
    assert.equal(revoked.status, "REVOKED");
  });
});
