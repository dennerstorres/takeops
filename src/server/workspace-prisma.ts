import { prisma } from "./db.ts";
import {
  DuplicateSlugError,
  type MembershipRecord,
  type TeamMemberRecord,
  type WorkspaceRecord,
  type WorkspaceRepository,
  type WorkspaceRole,
} from "./workspace-repository.ts";

function slugConflict(error: unknown) {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    error.code !== "P2002"
  ) {
    return false;
  }
  const target =
    "meta" in error &&
    typeof error.meta === "object" &&
    error.meta !== null &&
    "target" in error.meta
      ? error.meta.target
      : undefined;
  const text = Array.isArray(target) ? target.join(" ") : String(target ?? "");
  return text.includes("slug");
}

function mapWorkspace(row: {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}): WorkspaceRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logoUrl,
    timezone: row.timezone,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapMembership(row: {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: Date;
}): MembershipRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    userId: row.userId,
    role: row.role,
    createdAt: row.createdAt,
  };
}

export const prismaWorkspaceRepository: WorkspaceRepository = {
  async createWorkspaceWithOwner(input) {
    try {
      const workspace = await prisma.workspace.create({
        data: {
          name: input.name,
          slug: input.slug,
          logoUrl: input.logoUrl,
          timezone: input.timezone,
          members: {
            create: {
              userId: input.userId,
              role: "OWNER",
            },
          },
        },
        include: { members: true },
      });
      const membership = workspace.members[0];
      if (!membership) {
        throw new Error("Workspace criado sem membership.");
      }
      return {
        workspace: mapWorkspace(workspace),
        membership: mapMembership(membership),
      };
    } catch (error) {
      if (slugConflict(error)) throw new DuplicateSlugError();
      throw error;
    }
  },

  async findMembership(userId, workspaceId) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId, workspaceId },
    });
    return membership ? mapMembership(membership) : null;
  },

  async findWorkspace(workspaceId) {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId },
    });
    return workspace ? mapWorkspace(workspace) : null;
  },

  async listForUser(userId) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((membership) => ({
      workspace: mapWorkspace(membership.workspace),
      membership: mapMembership(membership),
    }));
  },

  async listMembers(workspaceId) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((membership): TeamMemberRecord => ({
      userId: membership.user.id,
      workspaceId: membership.workspaceId,
      name: membership.user.name,
      email: membership.user.email,
      image: membership.user.image,
      role: membership.role,
      joinedAt: membership.createdAt,
    }));
  },

  async updateMemberRole(workspaceId, userId, role) {
    const updated = await prisma.workspaceMember.updateMany({
      where: { workspaceId, userId },
      data: { role },
    });
    if (updated.count !== 1) return null;
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
    });
    return membership ? mapMembership(membership) : null;
  },
};
