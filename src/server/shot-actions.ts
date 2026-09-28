"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ValidationError } from "@/server/errors";
import { prismaProjectRepository } from "@/server/project-prisma";
import { prismaSceneRepository } from "@/server/scene-prisma";
import { runAction, type ActionFailure } from "@/server/service";
import {
  createShot,
  deleteShot,
  listShots,
  reorderShots,
  updateShot,
  type ShotDeps,
} from "@/server/shot";
import { prismaShotRepository } from "@/server/shot-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type ShotFormState = Pick<ActionFailure, "message" | "fields"> | null;

const deps: ShotDeps = {
  workspaces: prismaWorkspaceRepository,
  projects: prismaProjectRepository,
  scenes: prismaSceneRepository,
  shots: prismaShotRepository,
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

function ids(formData: FormData) {
  return {
    projectId: String(formData.get("projectId") ?? ""),
    sceneId: String(formData.get("sceneId") ?? ""),
    shotId: String(formData.get("shotId") ?? ""),
  };
}

function shotInput(formData: FormData) {
  return {
    name: formData.get("name"),
    cameraLabel: formData.get("cameraLabel"),
    shotType: formData.get("shotType"),
    framing: formData.get("framing"),
    angle: formData.get("angle"),
    subject: formData.get("subject"),
    movement: formData.get("movement"),
    description: formData.get("description"),
    requiredTakes: formData.get("requiredTakes"),
    notes: formData.get("notes"),
    status: formData.get("status"),
  };
}

// Voltar para a cena mantém a pessoa onde estava editando os planos.
function backToScene(projectId: string, sceneId: string): never {
  revalidatePath(`/producoes/${projectId}/cenas`);
  redirect(`/producoes/${projectId}/cenas/${sceneId}#shots`);
}

export async function createShotAction(
  _state: ShotFormState,
  formData: FormData,
): Promise<ShotFormState> {
  const current = await currentWorkspace();
  const { projectId, sceneId } = ids(formData);
  const result = await runAction(
    current,
    { operation: "create", entity: "Shot" },
    () =>
      createShot(
        current.userId,
        current.workspaceId,
        projectId,
        sceneId,
        shotInput(formData),
        deps,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  backToScene(projectId, sceneId);
}

export async function updateShotAction(
  _state: ShotFormState,
  formData: FormData,
): Promise<ShotFormState> {
  const current = await currentWorkspace();
  const { projectId, sceneId, shotId } = ids(formData);
  const result = await runAction(
    current,
    { operation: "update", entity: "Shot" },
    () =>
      updateShot(
        current.userId,
        current.workspaceId,
        projectId,
        sceneId,
        shotId,
        shotInput(formData),
        deps,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  backToScene(projectId, sceneId);
}

export async function moveShotAction(formData: FormData) {
  const current = await currentWorkspace();
  const { projectId, sceneId, shotId } = ids(formData);
  const direction = String(formData.get("direction") ?? "");
  await runAction(
    current,
    { operation: "reorder", entity: "Shot" },
    async () => {
      const rows = await listShots(
        current.userId,
        current.workspaceId,
        projectId,
        sceneId,
        deps,
      );
      const index = rows.findIndex((row) => row.id === shotId);
      const target = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || target < 0 || target >= rows.length) {
        throw new ValidationError({ order: "O shot já está nessa ponta." });
      }
      const shotIds = rows.map((row) => row.id);
      const [item] = shotIds.splice(index, 1);
      shotIds.splice(target, 0, item);
      return reorderShots(
        current.userId,
        current.workspaceId,
        projectId,
        sceneId,
        { shotIds },
        deps,
      );
    },
  );
  backToScene(projectId, sceneId);
}

export async function deleteShotAction(formData: FormData) {
  const current = await currentWorkspace();
  const { projectId, sceneId, shotId } = ids(formData);
  await runAction(current, { operation: "delete", entity: "Shot" }, () =>
    deleteShot(
      current.userId,
      current.workspaceId,
      projectId,
      sceneId,
      shotId,
      deps,
    ),
  );
  backToScene(projectId, sceneId);
}
