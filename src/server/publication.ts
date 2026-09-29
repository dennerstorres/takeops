import { NotFoundError } from "./errors.ts";
import { getProject } from "./project.ts";
import type { ProjectRepository } from "./project-repository.ts";
import type { PublicationRepository } from "./publication-repository.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

export type PublicationDeps = {
  workspaces: WorkspaceRepository;
  projects: ProjectRepository;
  publications: PublicationRepository;
};

export async function publicationScope(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: PublicationDeps,
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

export async function listPublications(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: PublicationDeps,
) {
  const scope = await publicationScope(userId, workspaceId, projectId, deps);
  const rows = await deps.publications.list(scope.workspaceId, scope.projectId);
  return rows.filter((row) => row.videoProjectId === scope.projectId);
}

export async function getPublication(
  userId: string,
  workspaceId: string,
  projectId: string,
  publicationId: string,
  deps: PublicationDeps,
) {
  const scope = await publicationScope(userId, workspaceId, projectId, deps);
  const row = await deps.publications.find(
    scope.workspaceId,
    scope.projectId,
    publicationId,
  );
  if (
    !row ||
    row.id !== publicationId ||
    row.videoProjectId !== scope.projectId
  ) {
    throw new NotFoundError();
  }
  return row;
}
