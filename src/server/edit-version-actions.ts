"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { prismaActivityRepository } from "@/server/activity-prisma";
import { auth } from "@/server/auth";
import { createEditVersion } from "@/server/edit-version";
import { prismaEditVersionRepository } from "@/server/edit-version-prisma";
import { prismaProjectRepository } from "@/server/project-prisma";
import { runAction, type ActionFailure } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type EditVersionFormState = Pick<
  ActionFailure,
  "message" | "fields"
> | null;

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

export async function createEditVersionAction(
  _state: EditVersionFormState,
  formData: FormData,
): Promise<EditVersionFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const result = await runAction(
    current,
    { operation: "create", entity: "EditVersion" },
    () =>
      createEditVersion(
        current.userId,
        current.workspaceId,
        projectId,
        {
          title: formData.get("title"),
          previewUrl: formData.get("previewUrl"),
          fileUrl: formData.get("fileUrl"),
          notes: formData.get("notes"),
        },
        {
          workspaces: prismaWorkspaceRepository,
          projects: prismaProjectRepository,
          versions: prismaEditVersionRepository,
          activities: prismaActivityRepository,
        },
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  const page = `/producoes/${projectId}/edicao`;
  revalidatePath(page);
  redirect(`${page}#versoes`);
}
