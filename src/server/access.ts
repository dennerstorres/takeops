import { claimEmailInvites } from "./invite.ts";
import { prismaInviteRepository } from "./invite-prisma.ts";
import { decideFirstAccess, listWorkspaces } from "./workspace.ts";
import { prismaWorkspaceRepository } from "./workspace-prisma.ts";

export async function openWorkspace(userId: string) {
  const current = await listWorkspaces(userId, prismaWorkspaceRepository);
  if (decideFirstAccess(userId, current).kind === "setup") {
    await claimEmailInvites(userId, prismaInviteRepository);
  }
  const memberships = await listWorkspaces(userId, prismaWorkspaceRepository);
  return decideFirstAccess(userId, memberships);
}
