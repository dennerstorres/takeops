import { z } from "zod";
import type {
  EditVersionRepository,
  EditVersionWrite,
} from "./edit-version-repository.ts";
import { NotFoundError, ValidationError } from "./errors.ts";
import { externalUrl } from "./external-url.ts";
import { getProject } from "./project.ts";
import type { ProjectRepository } from "./project-repository.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

const writers = ["OWNER", "ADMIN", "MEMBER"] as const;

export type EditVersionDeps = {
  workspaces: WorkspaceRepository;
  projects: ProjectRepository;
  versions: EditVersionRepository;
};

const optionalText = (max: number, message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(max, message),
  );

const versionSchema = z.object({
  title: optionalText(120, "Use no máximo 120 caracteres."),
  previewUrl: optionalText(2048, "O link passou de 2048 caracteres."),
  fileUrl: optionalText(2048, "O link passou de 2048 caracteres."),
  notes: optionalText(4000, "As notas passaram de 4000 caracteres."),
});

function toWrite(input: unknown): EditVersionWrite {
  const data = parseInput(versionSchema, input);
  // Versão sem link nenhum não tem o que revisar.
  if (!data.previewUrl && !data.fileUrl) {
    throw new ValidationError({
      previewUrl: "Informe o link de preview ou do arquivo.",
    });
  }
  return {
    title: data.title ? data.title : null,
    previewUrl: data.previewUrl
      ? externalUrl(data.previewUrl, "previewUrl")
      : null,
    fileUrl: data.fileUrl ? externalUrl(data.fileUrl, "fileUrl") : null,
    notes: data.notes ? data.notes : null,
  };
}

export function versionLabel(versionNumber: number) {
  return `V${versionNumber}`;
}

async function projectScope(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: EditVersionDeps,
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

export async function listEditVersions(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: EditVersionDeps,
) {
  const scope = await projectScope(userId, workspaceId, projectId, deps);
  const rows = await deps.versions.list(scope.workspaceId, scope.projectId);
  return rows.filter((row) => row.videoProjectId === scope.projectId);
}

export async function getEditVersion(
  userId: string,
  workspaceId: string,
  projectId: string,
  versionId: string,
  deps: EditVersionDeps,
) {
  const scope = await projectScope(userId, workspaceId, projectId, deps);
  const version = await deps.versions.find(
    scope.workspaceId,
    scope.projectId,
    versionId,
  );
  if (
    !version ||
    version.id !== versionId ||
    version.videoProjectId !== scope.projectId
  ) {
    throw new NotFoundError();
  }
  return version;
}

export async function createEditVersion(
  userId: string,
  workspaceId: string,
  projectId: string,
  input: unknown,
  deps: EditVersionDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const data = toWrite(input);
  const scope = await projectScope(userId, workspaceId, projectId, deps);
  const created = await deps.versions.create(
    scope.workspaceId,
    scope.projectId,
    { ...data, createdById: userId },
  );
  if (!created || created.videoProjectId !== scope.projectId) {
    throw new NotFoundError();
  }
  return created;
}
