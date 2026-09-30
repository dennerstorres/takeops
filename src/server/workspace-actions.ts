"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { runAction, type ActionFailure } from "@/server/service";
import {
  createWorkspace,
  decideFirstAccess,
  listWorkspaces,
  updateWorkspaceSettings,
} from "@/server/workspace";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type CreateWorkspaceState = Pick<
  ActionFailure,
  "message" | "fields"
> | null;

export async function createFirstWorkspace(
  _state: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const existing = await listWorkspaces(userId, prismaWorkspaceRepository);
  if (decideFirstAccess(userId, existing).kind === "enter") redirect("/");

  const result = await runAction(
    { userId },
    { operation: "create", entity: "Workspace" },
    () =>
      createWorkspace(
        userId,
        { name: formData.get("name") },
        prismaWorkspaceRepository,
      ),
  );

  if (result.ok) redirect("/");
  return { message: result.message, fields: result.fields };
}

export type WorkspaceSettingsState =
  | (Pick<ActionFailure, "message" | "fields"> & { saved?: false })
  | { saved: true }
  | null;

export async function saveWorkspaceSettings(
  _state: WorkspaceSettingsState,
  formData: FormData,
): Promise<WorkspaceSettingsState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const context = {
    userId: session.user.id,
    workspaceId: access.workspace.workspace.id,
  };

  const result = await runAction(
    context,
    { operation: "update", entity: "Workspace" },
    () =>
      updateWorkspaceSettings(
        context.userId,
        context.workspaceId,
        {
          name: formData.get("name"),
          timezone: formData.get("timezone"),
          logoUrl: formData.get("logoUrl"),
        },
        prismaWorkspaceRepository,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  // Nome e fuso aparecem no shell e em todas as datas.
  revalidatePath("/", "layout");
  return { saved: true };
}
