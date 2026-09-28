"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import {
  changeIdeaStatus,
  createIdea,
  deleteIdea,
  updateIdea,
} from "@/server/idea";
import { prismaIdeaRepository } from "@/server/idea-prisma";
import { runAction, type ActionFailure } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type IdeaFormState = Pick<ActionFailure, "message" | "fields"> | null;

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

function ideaInput(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    format: formData.get("format"),
    objective: formData.get("objective"),
    product: formData.get("product"),
    audience: formData.get("audience"),
    referenceUrl: formData.get("referenceUrl"),
    notes: formData.get("notes"),
  };
}

export async function createIdeaAction(
  _state: IdeaFormState,
  formData: FormData,
): Promise<IdeaFormState> {
  const current = await currentWorkspace();
  const result = await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "create", entity: "Idea" },
    () =>
      createIdea(
        current.userId,
        current.workspaceId,
        ideaInput(formData),
        prismaWorkspaceRepository,
        prismaIdeaRepository,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  redirect(`/ideias/${result.data.id}`);
}

export async function updateIdeaAction(
  _state: IdeaFormState,
  formData: FormData,
): Promise<IdeaFormState> {
  const current = await currentWorkspace();
  const ideaId = String(formData.get("ideaId") ?? "");
  const result = await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "update", entity: "Idea" },
    () =>
      updateIdea(
        current.userId,
        current.workspaceId,
        ideaId,
        ideaInput(formData),
        prismaWorkspaceRepository,
        prismaIdeaRepository,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath(`/ideias/${ideaId}`);
  revalidatePath("/ideias");
  return { message: "Ideia salva." };
}

export async function changeIdeaStatusAction(formData: FormData) {
  const current = await currentWorkspace();
  const ideaId = String(formData.get("ideaId") ?? "");
  await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "change-status", entity: "Idea" },
    () =>
      changeIdeaStatus(
        current.userId,
        current.workspaceId,
        ideaId,
        { status: formData.get("status") },
        prismaWorkspaceRepository,
        prismaIdeaRepository,
      ),
  );
  revalidatePath(`/ideias/${ideaId}`);
  revalidatePath("/ideias");
}

export async function deleteIdeaAction(formData: FormData) {
  const current = await currentWorkspace();
  const ideaId = String(formData.get("ideaId") ?? "");
  await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "delete", entity: "Idea" },
    () =>
      deleteIdea(
        current.userId,
        current.workspaceId,
        ideaId,
        prismaWorkspaceRepository,
        prismaIdeaRepository,
      ),
  );
  revalidatePath("/ideias");
  redirect("/ideias");
}
