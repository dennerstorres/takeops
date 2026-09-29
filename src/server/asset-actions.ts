"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import {
  createAsset,
  deleteAsset,
  updateAsset,
  type AssetDeps,
} from "@/server/asset";
import { prismaAssetRepository } from "@/server/asset-prisma";
import { auth } from "@/server/auth";
import { prismaProjectRepository } from "@/server/project-prisma";
import { runAction, type ActionFailure } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type AssetFormState = Pick<ActionFailure, "message" | "fields"> | null;

const deps: AssetDeps = {
  workspaces: prismaWorkspaceRepository,
  projects: prismaProjectRepository,
  assets: prismaAssetRepository,
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

function assetInput(formData: FormData) {
  return {
    type: formData.get("type"),
    title: formData.get("title"),
    url: formData.get("url"),
    description: formData.get("description"),
  };
}

function page(projectId: string) {
  return `/producoes/${projectId}/arquivos`;
}

export async function createAssetAction(
  _state: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const result = await runAction(
    current,
    { operation: "create", entity: "Asset" },
    () =>
      createAsset(
        current.userId,
        current.workspaceId,
        projectId,
        assetInput(formData),
        deps,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath(page(projectId));
  redirect(page(projectId));
}

export async function updateAssetAction(
  _state: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const result = await runAction(
    current,
    { operation: "update", entity: "Asset" },
    () =>
      updateAsset(
        current.userId,
        current.workspaceId,
        projectId,
        String(formData.get("assetId") ?? ""),
        assetInput(formData),
        deps,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath(page(projectId));
  redirect(page(projectId));
}

export async function deleteAssetAction(formData: FormData) {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  await runAction(current, { operation: "delete", entity: "Asset" }, () =>
    deleteAsset(
      current.userId,
      current.workspaceId,
      projectId,
      String(formData.get("assetId") ?? ""),
      deps,
    ),
  );
  revalidatePath(page(projectId));
  redirect(page(projectId));
}
