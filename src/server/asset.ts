import { z } from "zod";
import { assetTypes } from "./asset-labels.ts";
import type { AssetRepository, AssetWrite } from "./asset-repository.ts";
import { NotFoundError } from "./errors.ts";
import { externalUrl } from "./external-url.ts";
import { getProject } from "./project.ts";
import type { ProjectRepository } from "./project-repository.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

const writers = ["OWNER", "ADMIN", "MEMBER"] as const;

export type AssetDeps = {
  workspaces: WorkspaceRepository;
  projects: ProjectRepository;
  assets: AssetRepository;
};

const assetSchema = z.object({
  type: z.enum(assetTypes, { error: "Escolha um tipo." }),
  title: z
    .string({ error: "Informe o título." })
    .trim()
    .min(1, "Informe o título.")
    .max(120, "Use no máximo 120 caracteres."),
  url: z
    .string({ error: "Informe o link." })
    .trim()
    .min(1, "Informe o link.")
    .max(2048, "O link passou de 2048 caracteres."),
  description: z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(1000, "A descrição passou de 1000 caracteres."),
  ),
});

function toWrite(input: unknown): AssetWrite {
  const data = parseInput(assetSchema, input);
  return {
    type: data.type,
    title: data.title,
    url: externalUrl(data.url),
    description: data.description ? data.description : null,
  };
}

async function projectScope(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: AssetDeps,
) {
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    deps.workspaces,
    deps.projects,
  );
  return { workspaceId: project.workspaceId, projectId: project.id };
}

export async function listAssets(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: AssetDeps,
) {
  const scope = await projectScope(userId, workspaceId, projectId, deps);
  const rows = await deps.assets.list(scope.workspaceId, scope.projectId);
  return rows.filter((asset) => asset.videoProjectId === scope.projectId);
}

export async function createAsset(
  userId: string,
  workspaceId: string,
  projectId: string,
  input: unknown,
  deps: AssetDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const data = toWrite(input);
  const scope = await projectScope(userId, workspaceId, projectId, deps);
  const created = await deps.assets.create(scope.workspaceId, scope.projectId, {
    ...data,
    createdById: userId,
  });
  if (!created || created.videoProjectId !== scope.projectId) {
    throw new NotFoundError();
  }
  return created;
}

export async function updateAsset(
  userId: string,
  workspaceId: string,
  projectId: string,
  assetId: string,
  input: unknown,
  deps: AssetDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const data = toWrite(input);
  const scope = await projectScope(userId, workspaceId, projectId, deps);
  const updated = await deps.assets.update(
    scope.workspaceId,
    scope.projectId,
    assetId,
    data,
  );
  if (
    !updated ||
    updated.id !== assetId ||
    updated.videoProjectId !== scope.projectId
  ) {
    throw new NotFoundError();
  }
  return updated;
}

export async function deleteAsset(
  userId: string,
  workspaceId: string,
  projectId: string,
  assetId: string,
  deps: AssetDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const scope = await projectScope(userId, workspaceId, projectId, deps);
  const removed = await deps.assets.remove(
    scope.workspaceId,
    scope.projectId,
    assetId,
  );
  if (!removed) throw new NotFoundError();
}
