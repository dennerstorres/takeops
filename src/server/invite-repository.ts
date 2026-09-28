import type { WorkspaceRole } from "./workspace-repository.ts";

export const inviteStatuses = ["PENDING", "ACCEPTED", "REVOKED"] as const;

export type InviteStatus = (typeof inviteStatuses)[number];

export type InviteRecord = {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  tokenHash: string;
  status: InviteStatus;
  invitedById: string;
  acceptedById: string | null;
  expiresAt: Date;
  createdAt: Date;
};

export type InviteUser = {
  id: string;
  email: string | null;
};

export type CreateInviteData = {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  tokenHash: string;
  invitedById: string;
  expiresAt: Date;
};

export type InviteRepository = {
  findUser(userId: string): Promise<InviteUser | null>;
  memberHasEmail(workspaceId: string, email: string): Promise<boolean>;
  findPending(workspaceId: string, email: string): Promise<InviteRecord | null>;
  create(input: CreateInviteData): Promise<InviteRecord>;
  listByWorkspace(workspaceId: string): Promise<InviteRecord[]>;
  listPendingByEmail(email: string): Promise<InviteRecord[]>;
  findByTokenHash(tokenHash: string): Promise<InviteRecord | null>;
  accept(
    inviteId: string,
    userId: string,
    email: string,
  ): Promise<InviteRecord>;
  revoke(inviteId: string, workspaceId: string): Promise<InviteRecord | null>;
};
