import { prisma } from "./db.ts";
import { ForbiddenError, NotFoundError } from "./errors.ts";
import { normalizeEmail } from "./invite.ts";
import type {
  InviteRecord,
  InviteRepository,
  InviteStatus,
} from "./invite-repository.ts";
import type { WorkspaceRole } from "./workspace-repository.ts";

function mapInvite(row: {
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
}): InviteRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    email: row.email,
    role: row.role,
    tokenHash: row.tokenHash,
    status: row.status,
    invitedById: row.invitedById,
    acceptedById: row.acceptedById,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

export const prismaInviteRepository: InviteRepository = {
  async findUser(userId) {
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { id: true, email: true },
    });
    return user ? { id: user.id, email: user.email } : null;
  },

  async memberHasEmail(workspaceId, email) {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: { user: { select: { email: true } } },
    });
    return members.some(
      (member) =>
        member.user.email !== null &&
        normalizeEmail(member.user.email) === email,
    );
  },

  async findPending(workspaceId, email) {
    const invite = await prisma.workspaceInvite.findFirst({
      where: { workspaceId, email, status: "PENDING" },
    });
    return invite ? mapInvite(invite) : null;
  },

  async create(input) {
    const invite = await prisma.workspaceInvite.create({ data: input });
    return mapInvite(invite);
  },

  async listByWorkspace(workspaceId) {
    const rows = await prisma.workspaceInvite.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapInvite);
  },

  async listPendingByEmail(email) {
    const rows = await prisma.workspaceInvite.findMany({
      where: { email, status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapInvite);
  },

  async findByTokenHash(tokenHash) {
    const invite = await prisma.workspaceInvite.findFirst({
      where: { tokenHash },
    });
    return invite ? mapInvite(invite) : null;
  },

  async accept(inviteId, userId, email) {
    const saved = await prisma.$transaction(async (tx) => {
      const invite = await tx.workspaceInvite.findFirst({
        where: { id: inviteId },
      });
      if (!invite || normalizeEmail(invite.email) !== email) {
        throw new ForbiddenError("Este convite é para outro e-mail.");
      }
      if (invite.status === "ACCEPTED") return invite;
      if (
        invite.status !== "PENDING" ||
        invite.expiresAt.getTime() <= Date.now()
      ) {
        throw new NotFoundError("Convite inválido ou expirado.");
      }

      const existing = await tx.workspaceMember.findFirst({
        where: { workspaceId: invite.workspaceId, userId },
      });
      if (!existing) {
        await tx.workspaceMember.create({
          data: {
            workspaceId: invite.workspaceId,
            userId,
            role: invite.role,
          },
        });
      }

      return tx.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", acceptedById: userId },
      });
    });
    return mapInvite(saved);
  },

  async revoke(inviteId, workspaceId) {
    const updated = await prisma.workspaceInvite.updateMany({
      where: { id: inviteId, workspaceId, status: "PENDING" },
      data: { status: "REVOKED" },
    });
    if (updated.count !== 1) return null;
    const invite = await prisma.workspaceInvite.findFirst({
      where: { id: inviteId, workspaceId },
    });
    return invite ? mapInvite(invite) : null;
  },
};
