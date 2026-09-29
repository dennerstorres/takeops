"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import {
  createContinuityNote,
  deleteContinuityNote,
  updateContinuityNote,
  type ContinuityDeps,
} from "@/server/continuity";
import { prismaContinuityRepository } from "@/server/continuity-prisma";
import { prismaProjectRepository } from "@/server/project-prisma";
import { runAction, type ActionFailure } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type ContinuityFormState = Pick<
  ActionFailure,
  "message" | "fields"
> | null;

const deps: ContinuityDeps = {
  workspaces: prismaWorkspaceRepository,
  projects: prismaProjectRepository,
  continuity: prismaContinuityRepository,
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

function noteInput(formData: FormData) {
  return {
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description"),
  };
}

function page(projectId: string) {
  return `/producoes/${projectId}/continuidade`;
}

export async function createContinuityAction(
  _state: ContinuityFormState,
  formData: FormData,
): Promise<ContinuityFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const result = await runAction(
    current,
    { operation: "create", entity: "ContinuityNote" },
    () =>
      createContinuityNote(
        current.userId,
        current.workspaceId,
        projectId,
        noteInput(formData),
        deps,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath(page(projectId));
  redirect(page(projectId));
}

export async function updateContinuityAction(
  _state: ContinuityFormState,
  formData: FormData,
): Promise<ContinuityFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const result = await runAction(
    current,
    { operation: "update", entity: "ContinuityNote" },
    () =>
      updateContinuityNote(
        current.userId,
        current.workspaceId,
        projectId,
        String(formData.get("noteId") ?? ""),
        noteInput(formData),
        deps,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath(page(projectId));
  redirect(page(projectId));
}

export async function deleteContinuityAction(formData: FormData) {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  await runAction(
    current,
    { operation: "delete", entity: "ContinuityNote" },
    () =>
      deleteContinuityNote(
        current.userId,
        current.workspaceId,
        projectId,
        String(formData.get("noteId") ?? ""),
        deps,
      ),
  );
  revalidatePath(page(projectId));
  redirect(page(projectId));
}
