import { requireMembership } from "./workspace.ts";
import {
  workspaceRoles,
  type TeamMemberRecord,
  type WorkspaceRepository,
  type WorkspaceRole,
} from "./workspace-repository.ts";

const roleLabels: Record<WorkspaceRole, string> = {
  OWNER: "Dono",
  ADMIN: "Admin",
  MEMBER: "Membro",
  VIEWER: "Leitor",
};

export type TeamMember = {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: WorkspaceRole;
};

export function roleLabel(role: WorkspaceRole) {
  return roleLabels[role];
}

function safeImage(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return value;
  } catch {
    return null;
  }
  return null;
}

function byTeamOrder(left: TeamMemberRecord, right: TeamMemberRecord) {
  const roleOrder =
    workspaceRoles.indexOf(left.role) - workspaceRoles.indexOf(right.role);
  if (roleOrder !== 0) return roleOrder;
  const name = (left.name ?? "").localeCompare(right.name ?? "", "pt-BR");
  if (name !== 0) return name;
  return left.userId.localeCompare(right.userId);
}

export async function listTeam(
  userId: string,
  workspaceId: string,
  repository: WorkspaceRepository,
): Promise<TeamMember[]> {
  const membership = await requireMembership(userId, workspaceId, repository);
  const rows = await repository.listMembers(membership.workspaceId);
  return rows
    .filter((row) => row.workspaceId === membership.workspaceId)
    .sort(byTeamOrder)
    .map((row) => ({
      userId: row.userId,
      name: row.name,
      email: row.email,
      image: safeImage(row.image),
      role: row.role,
    }));
}
