import { z } from "zod";
import { ForbiddenError } from "./errors.ts";
import { parseInput } from "./validation.ts";
import { requireMembership, requireRole } from "./workspace.ts";
import {
  workspaceRoles,
  type TeamMemberRecord,
  type WorkspaceRepository,
  type WorkspaceRole,
} from "./workspace-repository.ts";

const roleChangeSchema = z.object({
  userId: z.string().trim().min(1).max(80),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"], {
    error: "Escolha um papel.",
  }),
});

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

export function manageableRoles(
  actor: WorkspaceRole,
  target: WorkspaceRole,
): WorkspaceRole[] {
  if (actor === "OWNER" && target !== "OWNER") {
    return ["ADMIN", "MEMBER", "VIEWER"];
  }
  if (actor === "ADMIN" && (target === "MEMBER" || target === "VIEWER")) {
    return ["MEMBER", "VIEWER"];
  }
  return [];
}

export async function changeMemberRole(
  actorId: string,
  workspaceId: string,
  input: unknown,
  repository: WorkspaceRepository,
) {
  const data = parseInput(roleChangeSchema, input);
  if (data.userId === actorId) {
    throw new ForbiddenError("Você não pode alterar o próprio papel.");
  }

  const actor = await requireRole(
    actorId,
    workspaceId,
    ["OWNER", "ADMIN"],
    repository,
  );
  const target = await repository.findMembership(data.userId, workspaceId);
  if (
    !target ||
    target.userId !== data.userId ||
    target.workspaceId !== workspaceId
  ) {
    throw new ForbiddenError();
  }

  const allowed = manageableRoles(actor.role, target.role);
  if (!allowed.includes(data.role)) {
    throw new ForbiddenError("Você não pode alterar esse papel.");
  }
  if (target.role === data.role) return target;

  const updated = await repository.updateMemberRole(
    workspaceId,
    data.userId,
    data.role,
  );
  if (
    !updated ||
    updated.userId !== data.userId ||
    updated.workspaceId !== workspaceId ||
    updated.role !== data.role
  ) {
    throw new ForbiddenError();
  }
  return updated;
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
