"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { createInvite, revokeInvite } from "@/server/invite";
import { prismaInviteRepository } from "@/server/invite-prisma";
import { runAction, type ActionFailure } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type CreateInviteState = Pick<ActionFailure, "message" | "fields"> & {
  token?: string;
};

async function currentWorkspace() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  return {
    userId: session.user.id,
    workspaceId: access.workspace.workspace.id,
  };
}

export async function createTeamInvite(
  _state: CreateInviteState | null,
  formData: FormData,
): Promise<CreateInviteState | null> {
  const current = await currentWorkspace();
  const result = await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "invite", entity: "WorkspaceInvite" },
    () =>
      createInvite(
        current.userId,
        current.workspaceId,
        { email: formData.get("email"), role: formData.get("role") },
        prismaWorkspaceRepository,
        prismaInviteRepository,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath("/equipe");
  return { message: "Convite criado.", token: result.data.token };
}

export async function revokeTeamInvite(formData: FormData) {
  const current = await currentWorkspace();
  await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "revoke", entity: "WorkspaceInvite" },
    () =>
      revokeInvite(
        current.userId,
        current.workspaceId,
        String(formData.get("inviteId") ?? ""),
        prismaWorkspaceRepository,
        prismaInviteRepository,
      ),
  );
  revalidatePath("/equipe");
}
