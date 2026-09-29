"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { saveEditingInfo } from "@/server/editing";
import { prismaEditingRepository } from "@/server/editing-prisma";
import { prismaProjectRepository } from "@/server/project-prisma";
import { runAction, type ActionFailure } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type EditingFormState =
  | (Pick<ActionFailure, "message" | "fields"> & { saved?: false })
  | { saved: true }
  | null;

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

export async function saveEditingAction(
  _state: EditingFormState,
  formData: FormData,
): Promise<EditingFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const result = await runAction(
    current,
    { operation: "save", entity: "EditingInfo" },
    () =>
      saveEditingInfo(
        current.userId,
        current.workspaceId,
        projectId,
        {
          editorId: formData.get("editorId"),
          software: formData.get("software"),
          projectFileUrl: formData.get("projectFileUrl"),
          notes: formData.get("notes"),
          targetResolution: formData.get("targetResolution"),
          targetFps: formData.get("targetFps"),
          aspectRatio: formData.get("aspectRatio"),
          captionsRequired: formData.get("captionsRequired"),
          musicRequired: formData.get("musicRequired"),
        },
        {
          workspaces: prismaWorkspaceRepository,
          projects: prismaProjectRepository,
          editing: prismaEditingRepository,
        },
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath(`/producoes/${projectId}/edicao`);
  return { saved: true };
}
