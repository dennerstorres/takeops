"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import {
  createCharacter,
  deleteCharacter,
  updateCharacter,
  type CharacterDeps,
} from "@/server/character";
import { prismaCharacterRepository } from "@/server/character-prisma";
import { prismaProjectRepository } from "@/server/project-prisma";
import { prismaSceneRepository } from "@/server/scene-prisma";
import { runAction, type ActionFailure } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type CharacterFormState =
  | (Pick<ActionFailure, "message" | "fields"> & { ok?: false })
  | { ok: true }
  | null;

const deps: CharacterDeps = {
  workspaces: prismaWorkspaceRepository,
  projects: prismaProjectRepository,
  scenes: prismaSceneRepository,
  characters: prismaCharacterRepository,
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

function characterInput(formData: FormData) {
  return {
    name: formData.get("name"),
    actorName: formData.get("actorName"),
    userId: formData.get("userId"),
  };
}

function refresh(projectId: string) {
  revalidatePath(`/producoes/${projectId}/roteiro`);
  revalidatePath(`/producoes/${projectId}/cenas`, "layout");
}

export async function createCharacterAction(
  _state: CharacterFormState,
  formData: FormData,
): Promise<CharacterFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const result = await runAction(
    current,
    { operation: "create", entity: "ProjectCharacter" },
    () =>
      createCharacter(
        current.userId,
        current.workspaceId,
        projectId,
        characterInput(formData),
        deps,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  refresh(projectId);
  return { ok: true };
}

export async function updateCharacterAction(
  _state: CharacterFormState,
  formData: FormData,
): Promise<CharacterFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const characterId = String(formData.get("characterId") ?? "");
  const result = await runAction(
    current,
    { operation: "update", entity: "ProjectCharacter" },
    () =>
      updateCharacter(
        current.userId,
        current.workspaceId,
        projectId,
        characterId,
        characterInput(formData),
        deps,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  refresh(projectId);
  return { ok: true };
}

export async function deleteCharacterAction(formData: FormData) {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const characterId = String(formData.get("characterId") ?? "");
  await runAction(
    current,
    { operation: "delete", entity: "ProjectCharacter" },
    () =>
      deleteCharacter(
        current.userId,
        current.workspaceId,
        projectId,
        characterId,
        deps,
      ),
  );
  refresh(projectId);
}
