import { createHash, randomBytes } from "node:crypto";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import type { InviteRecord, InviteRepository } from "./invite-repository.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";
import type {
  WorkspaceRepository,
  WorkspaceRole,
} from "./workspace-repository.ts";
import { z } from "zod";

export const inviteLifetimeMs = 7 * 24 * 60 * 60 * 1000;

const createInviteSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail.")
    .max(200, "Use no máximo 200 caracteres.")
    .email("Informe um e-mail válido."),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"], {
    error: "Escolha um papel.",
  }),
});

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function invitableRoles(role: WorkspaceRole): WorkspaceRole[] {
  if (role === "OWNER") return ["ADMIN", "MEMBER", "VIEWER"];
  if (role === "ADMIN") return ["MEMBER", "VIEWER"];
  return [];
}

function assertFresh(invite: InviteRecord, now: Date) {
  if (
    invite.status !== "PENDING" ||
    invite.expiresAt.getTime() <= now.getTime()
  ) {
    throw new NotFoundError("Convite inválido ou expirado.");
  }
}

export async function createInvite(
  userId: string,
  workspaceId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  invites: InviteRepository,
  now = new Date(),
) {
  const actor = await requireRole(
    userId,
    workspaceId,
    ["OWNER", "ADMIN"],
    workspaces,
  );
  const data = parseInput(createInviteSchema, input);
  const email = normalizeEmail(data.email);
  const allowed = invitableRoles(actor.role);
  if (!allowed.includes(data.role)) {
    throw new ValidationError({
      role: "Você não pode convidar com esse papel.",
    });
  }

  const actorUser = await invites.findUser(userId);
  if (actorUser?.email && normalizeEmail(actorUser.email) === email) {
    throw new ValidationError({ email: "Você já está nesta equipe." });
  }
  if (await invites.memberHasEmail(workspaceId, email)) {
    throw new ValidationError({ email: "Esta pessoa já está na equipe." });
  }
  if (await invites.findPending(workspaceId, email)) {
    throw new ValidationError({
      email: "Já existe um convite pendente para este e-mail.",
    });
  }

  const token = randomBytes(32).toString("base64url");
  const invite = await invites.create({
    workspaceId,
    email,
    role: data.role,
    tokenHash: hashInviteToken(token),
    invitedById: userId,
    expiresAt: new Date(now.getTime() + inviteLifetimeMs),
  });

  return { invite, token };
}

export async function listInvites(
  userId: string,
  workspaceId: string,
  workspaces: WorkspaceRepository,
  invites: InviteRepository,
  now = new Date(),
) {
  await requireRole(userId, workspaceId, ["OWNER", "ADMIN"], workspaces);
  const rows = await invites.listByWorkspace(workspaceId);
  return rows
    .filter(
      (row) => row.workspaceId === workspaceId && row.status === "PENDING",
    )
    .map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.expiresAt.getTime() <= now.getTime() ? "EXPIRED" : "PENDING",
      expiresAt: row.expiresAt,
    }));
}

export async function revokeInvite(
  userId: string,
  workspaceId: string,
  inviteId: string,
  workspaces: WorkspaceRepository,
  invites: InviteRepository,
) {
  const actor = await requireRole(
    userId,
    workspaceId,
    ["OWNER", "ADMIN"],
    workspaces,
  );
  const rows = await invites.listByWorkspace(workspaceId);
  const invite = rows.find(
    (row) => row.id === inviteId && row.workspaceId === workspaceId,
  );
  if (!invite) throw new ForbiddenError();
  if (!invitableRoles(actor.role).includes(invite.role)) {
    throw new ForbiddenError("Você não pode revogar este convite.");
  }
  if (invite.status !== "PENDING") {
    throw new ValidationError({ invite: "Este convite não está pendente." });
  }
  const revoked = await invites.revoke(invite.id, workspaceId);
  if (!revoked || revoked.workspaceId !== workspaceId)
    throw new ForbiddenError();
  return revoked;
}

export async function acceptInviteToken(
  userId: string,
  token: string,
  invites: InviteRepository,
  now = new Date(),
) {
  const user = await invites.findUser(userId);
  const email = user?.email ? normalizeEmail(user.email) : "";
  if (!email) {
    throw new ValidationError({
      email: "Sua conta Google não tem e-mail.",
    });
  }

  const invite = await invites.findByTokenHash(hashInviteToken(token));
  if (!invite || invite.status === "REVOKED") {
    throw new NotFoundError("Convite inválido ou expirado.");
  }
  if (normalizeEmail(invite.email) !== email) {
    throw new ForbiddenError("Este convite é para outro e-mail.");
  }
  if (invite.status === "ACCEPTED") return invite;
  assertFresh(invite, now);
  return invites.accept(invite.id, userId, email);
}

export async function claimEmailInvites(
  userId: string,
  invites: InviteRepository,
  now = new Date(),
) {
  const user = await invites.findUser(userId);
  const email = user?.email ? normalizeEmail(user.email) : "";
  if (!email) return [];

  const pending = await invites.listPendingByEmail(email);
  const claimed: InviteRecord[] = [];
  for (const invite of pending) {
    if (invite.status !== "PENDING") continue;
    if (normalizeEmail(invite.email) !== email) continue;
    if (invite.expiresAt.getTime() <= now.getTime()) continue;
    claimed.push(await invites.accept(invite.id, userId, email));
  }
  return claimed;
}
