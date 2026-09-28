"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { addParticipant, removeParticipant } from "@/server/participant";
import { prismaParticipantRepository } from "@/server/participant-prisma";
import { prismaProjectRepository } from "@/server/project-prisma";
import { runAction } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

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

export async function addParticipantAction(formData: FormData) {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "add", entity: "ProjectMember" },
    () =>
      addParticipant(
        current.userId,
        current.workspaceId,
        projectId,
        { userId: formData.get("userId"), role: formData.get("role") },
        prismaWorkspaceRepository,
        prismaProjectRepository,
        prismaParticipantRepository,
      ),
  );
  revalidatePath(`/producoes/${projectId}`);
}

export async function removeParticipantAction(formData: FormData) {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "remove", entity: "ProjectMember" },
    () =>
      removeParticipant(
        current.userId,
        current.workspaceId,
        projectId,
        { userId: formData.get("userId"), role: formData.get("role") },
        prismaWorkspaceRepository,
        prismaProjectRepository,
        prismaParticipantRepository,
      ),
  );
  revalidatePath(`/producoes/${projectId}`);
}
