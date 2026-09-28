"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { prismaProjectRepository } from "@/server/project-prisma";
import { prismaSceneRepository } from "@/server/scene-prisma";
import { runAction } from "@/server/service";
import { prismaShotRepository } from "@/server/shot-prisma";
import {
  registerTake,
  setFavoriteTake,
  updateTake,
  type TakeDeps,
} from "@/server/take";
import { prismaTakeRepository } from "@/server/take-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

const deps: TakeDeps = {
  workspaces: prismaWorkspaceRepository,
  projects: prismaProjectRepository,
  scenes: prismaSceneRepository,
  shots: prismaShotRepository,
  takes: prismaTakeRepository,
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

function target(formData: FormData) {
  return {
    projectId: String(formData.get("projectId") ?? ""),
    sceneId: String(formData.get("sceneId") ?? ""),
    shotId: String(formData.get("shotId") ?? ""),
  };
}

// Volta para a página de onde veio: cena ou Modo Gravação.
function back(formData: FormData, fallback: string): never {
  const returnTo = String(formData.get("returnTo") ?? "");
  const path = returnTo.startsWith("/producoes/") ? returnTo : fallback;
  revalidatePath(path.split("#")[0]);
  redirect(path);
}

export async function registerTakeAction(formData: FormData) {
  const current = await currentWorkspace();
  const where = target(formData);
  await runAction(current, { operation: "register", entity: "Take" }, () =>
    registerTake(
      current.userId,
      current.workspaceId,
      where,
      { status: formData.get("status"), notes: formData.get("notes") },
      deps,
    ),
  );
  back(formData, `/producoes/${where.projectId}/cenas/${where.sceneId}#shots`);
}

export async function updateTakeAction(formData: FormData) {
  const current = await currentWorkspace();
  const where = target(formData);
  await runAction(current, { operation: "update", entity: "Take" }, () =>
    updateTake(
      current.userId,
      current.workspaceId,
      where,
      String(formData.get("takeId") ?? ""),
      { status: formData.get("status"), notes: formData.get("notes") },
      deps,
    ),
  );
  back(formData, `/producoes/${where.projectId}/cenas/${where.sceneId}#shots`);
}

export async function favoriteTakeAction(formData: FormData) {
  const current = await currentWorkspace();
  const where = target(formData);
  const takeId = String(formData.get("takeId") ?? "");
  await runAction(current, { operation: "favorite", entity: "Take" }, () =>
    setFavoriteTake(
      current.userId,
      current.workspaceId,
      where,
      takeId ? takeId : null,
      deps,
    ),
  );
  back(formData, `/producoes/${where.projectId}/cenas/${where.sceneId}#shots`);
}
