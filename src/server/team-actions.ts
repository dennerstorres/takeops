"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { runAction } from "@/server/service";
import { changeMemberRole, removeMember } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export async function changeTeamRole(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");

  await runAction(
    {
      userId: session.user.id,
      workspaceId: access.workspace.workspace.id,
    },
    { operation: "change-role", entity: "WorkspaceMember" },
    () =>
      changeMemberRole(
        session.user.id,
        access.workspace.workspace.id,
        { userId: formData.get("userId"), role: formData.get("role") },
        prismaWorkspaceRepository,
      ),
  );
  revalidatePath("/equipe");
}

export async function removeTeamMember(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");

  await runAction(
    {
      userId: session.user.id,
      workspaceId: access.workspace.workspace.id,
    },
    { operation: "remove-member", entity: "WorkspaceMember" },
    () =>
      removeMember(
        session.user.id,
        access.workspace.workspace.id,
        { userId: formData.get("userId") },
        prismaWorkspaceRepository,
      ),
  );
  revalidatePath("/equipe");
}
