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

export type TeamMemberRecord = {
  userId: string;
  workspaceId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: WorkspaceRole;
  joinedAt: Date;
};

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
  listMembers(workspaceId: string): Promise<TeamMemberRecord[]>;
  updateMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
  ): Promise<MembershipRecord | null>;
  updateWorkspace(
    workspaceId: string,
    input: { name: string; timezone: string; logoUrl: string | null },
  ): Promise<WorkspaceRecord | null>;
  // Tira o acesso e as funções nas produções do workspace; autoria fica.
  removeMember(workspaceId: string, userId: string): Promise<boolean>;
};
