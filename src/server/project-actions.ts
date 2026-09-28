"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { prismaIdeaRepository } from "@/server/idea-prisma";
import {
  convertIdeaToProject,
  createProject,
  deleteProject,
  submitBoardMove,
  updateProject,
} from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { runAction, type ActionFailure } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type ProjectFormState = Pick<ActionFailure, "message" | "fields"> | null;

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

function projectInput(formData: FormData) {
  return {
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    objective: formData.get("objective"),
    audience: formData.get("audience"),
    product: formData.get("product"),
    format: formData.get("format"),
    aspectRatio: formData.get("aspectRatio"),
    estimatedDurationSeconds: formData.get("estimatedDurationSeconds"),
    priority: formData.get("priority"),
    thumbnailUrl: formData.get("thumbnailUrl"),
    ownerId: formData.get("ownerId"),
    plannedShootDate: formData.get("plannedShootDate"),
    plannedPublishDate: formData.get("plannedPublishDate"),
    sourceIdeaId: formData.get("sourceIdeaId"),
  };
}

export async function createProjectAction(
  _state: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const current = await currentWorkspace();
  const result = await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "create", entity: "VideoProject" },
    () =>
      createProject(
        current.userId,
        current.workspaceId,
        projectInput(formData),
        prismaWorkspaceRepository,
        prismaIdeaRepository,
        prismaProjectRepository,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  redirect(`/producoes/${result.data.id}`);
}

export async function updateProjectAction(
  _state: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const result = await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "update", entity: "VideoProject" },
    () =>
      updateProject(
        current.userId,
        current.workspaceId,
        projectId,
        projectInput(formData),
        prismaWorkspaceRepository,
        prismaIdeaRepository,
        prismaProjectRepository,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath(`/producoes/${projectId}`);
  revalidatePath("/producoes");
  return { message: "Produção salva." };
}

export async function moveProjectStatusAction(
  _state: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const result = await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "status", entity: "VideoProject" },
    () =>
      submitBoardMove(
        current.userId,
        current.workspaceId,
        {
          projectId,
          status: formData.get("status"),
          workspaceId: formData.get("workspaceId"),
        },
        prismaWorkspaceRepository,
        prismaProjectRepository,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath("/producoes");
  revalidatePath(`/producoes/${projectId}`);
  return null;
}

export async function convertIdeaAction(formData: FormData) {
  const current = await currentWorkspace();
  const ideaId = String(formData.get("ideaId") ?? "");
  const result = await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "convert", entity: "VideoProject" },
    () =>
      convertIdeaToProject(
        current.userId,
        current.workspaceId,
        ideaId,
        prismaWorkspaceRepository,
        prismaProjectRepository,
      ),
  );
  if (!result.ok) redirect(`/ideias/${ideaId}`);
  redirect(`/producoes/${result.data.id}`);
}

export async function deleteProjectAction(formData: FormData) {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "delete", entity: "VideoProject" },
    () =>
      deleteProject(
        current.userId,
        current.workspaceId,
        projectId,
        prismaWorkspaceRepository,
        prismaProjectRepository,
      ),
  );
  revalidatePath("/producoes");
  redirect("/producoes");
}
