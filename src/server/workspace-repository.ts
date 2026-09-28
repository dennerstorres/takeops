export const workspaceRoles = ["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const;

export type WorkspaceRole = (typeof workspaceRoles)[number];

export type WorkspaceRecord = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MembershipRecord = {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: Date;
};

export type WorkspaceWithMembership = {
  workspace: WorkspaceRecord;
  membership: MembershipRecord;
};

export type CreateWorkspaceData = {
  name: string;
  slug: string;
  logoUrl: string | null;
  timezone: string;
  userId: string;
};

export class DuplicateSlugError extends Error {
  constructor() {
    super("slug already used");
    this.name = "DuplicateSlugError";
  }
}

export type WorkspaceRepository = {
  createWorkspaceWithOwner(
    input: CreateWorkspaceData,
  ): Promise<WorkspaceWithMembership>;
  findMembership(
    userId: string,
    workspaceId: string,
  ): Promise<MembershipRecord | null>;
  findWorkspace(workspaceId: string): Promise<WorkspaceRecord | null>;
  listForUser(userId: string): Promise<WorkspaceWithMembership[]>;
};
