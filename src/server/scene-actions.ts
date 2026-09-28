"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { prismaProjectRepository } from "@/server/project-prisma";
import { createScene, deleteScene, updateScene } from "@/server/scene";
import { prismaSceneRepository } from "@/server/scene-prisma";
import { runAction, type ActionFailure } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type SceneFormState = Pick<ActionFailure, "message" | "fields"> | null;

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

function sceneInput(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    speakerId: formData.get("speakerId"),
    dialogue: formData.get("dialogue"),
    action: formData.get("action"),
    estimatedDurationSeconds: formData.get("estimatedDurationSeconds"),
    cameraInstructions: formData.get("cameraInstructions"),
    editingInstructions: formData.get("editingInstructions"),
    continuityNotes: formData.get("continuityNotes"),
    status: formData.get("status"),
  };
}

export async function createSceneAction(
  _state: SceneFormState,
  formData: FormData,
): Promise<SceneFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const result = await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "create", entity: "Scene" },
    () =>
      createScene(
        current.userId,
        current.workspaceId,
        projectId,
        sceneInput(formData),
        prismaWorkspaceRepository,
        prismaProjectRepository,
        prismaSceneRepository,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath(`/producoes/${projectId}/cenas`);
  redirect(`/producoes/${projectId}/cenas`);
}

export async function updateSceneAction(
  _state: SceneFormState,
  formData: FormData,
): Promise<SceneFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const sceneId = String(formData.get("sceneId") ?? "");
  const result = await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "update", entity: "Scene" },
    () =>
      updateScene(
        current.userId,
        current.workspaceId,
        projectId,
        sceneId,
        sceneInput(formData),
        prismaWorkspaceRepository,
        prismaProjectRepository,
        prismaSceneRepository,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath(`/producoes/${projectId}/cenas`);
  redirect(`/producoes/${projectId}/cenas`);
}

export async function deleteSceneAction(formData: FormData) {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const sceneId = String(formData.get("sceneId") ?? "");
  await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "delete", entity: "Scene" },
    () =>
      deleteScene(
        current.userId,
        current.workspaceId,
        projectId,
        sceneId,
        prismaWorkspaceRepository,
        prismaProjectRepository,
        prismaSceneRepository,
      ),
  );
  revalidatePath(`/producoes/${projectId}/cenas`);
  redirect(`/producoes/${projectId}/cenas`);
}
