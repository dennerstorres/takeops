"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { prismaProjectRepository } from "@/server/project-prisma";
import {
  createScene,
  deleteScene,
  duplicateScene,
  listScenes,
  reorderScenes,
  updateScene,
} from "@/server/scene";
import { ValidationError } from "@/server/errors";
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

export type SceneAutosaveResult =
  | { ok: true }
  | { ok: false; message: string; fields?: Record<string, string> };

// Autosave grava sem sair da página. A edição fica no formulário mesmo
// quando o servidor recusa, para a pessoa corrigir e tentar de novo.
export async function autosaveSceneAction(
  formData: FormData,
): Promise<SceneAutosaveResult> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const sceneId = String(formData.get("sceneId") ?? "");
  const result = await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "autosave", entity: "Scene" },
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
  if (!result.ok) {
    return { ok: false, message: result.message, fields: result.fields };
  }
  return { ok: true };
}

export async function duplicateSceneAction(formData: FormData) {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const sceneId = String(formData.get("sceneId") ?? "");
  await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "duplicate", entity: "Scene" },
    () =>
      duplicateScene(
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

export async function moveSceneAction(formData: FormData) {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const sceneId = String(formData.get("sceneId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  await runAction(
    { userId: current.userId, workspaceId: current.workspaceId },
    { operation: "reorder", entity: "Scene" },
    async () => {
      const rows = await listScenes(
        current.userId,
        current.workspaceId,
        projectId,
        prismaWorkspaceRepository,
        prismaProjectRepository,
        prismaSceneRepository,
      );
      const index = rows.findIndex((row) => row.id === sceneId);
      const target = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || target < 0 || target >= rows.length) {
        throw new ValidationError({
          order: "A cena já está nessa ponta.",
        });
      }
      const ids = rows.map((row) => row.id);
      const [item] = ids.splice(index, 1);
      ids.splice(target, 0, item);
      return reorderScenes(
        current.userId,
        current.workspaceId,
        projectId,
        { sceneIds: ids },
        prismaWorkspaceRepository,
        prismaProjectRepository,
        prismaSceneRepository,
      );
    },
  );
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
