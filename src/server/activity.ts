import type {
  ActivityRepository,
  ActivityWrite,
} from "./activity-repository.ts";
import { getProject } from "./project.ts";
import type { ProjectRepository } from "./project-repository.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

export type ActivityDeps = {
  workspaces: WorkspaceRepository;
  projects: ProjectRepository;
  activities: ActivityRepository;
};

// Atividade é efeito de uma operação que já passou pela autorização do
// serviço dela. Falhar aqui não desfaz a operação: só vai para o log técnico.
export async function recordActivity(
  activities: ActivityRepository,
  input: ActivityWrite,
) {
  try {
    await activities.record(input);
  } catch (error) {
    console.error("activity.record", {
      workspaceId: input.workspaceId,
      action: input.action,
      entity: input.entityType,
      error,
    });
  }
}

export async function listProjectActivity(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: ActivityDeps,
  limit = 100,
) {
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    deps.workspaces,
    deps.projects,
  );
  const rows = await deps.activities.listForProject(
    project.workspaceId,
    project.id,
    Math.min(Math.max(limit, 1), 200),
  );
  return rows.filter(
    (row) =>
      row.workspaceId === project.workspaceId &&
      row.videoProjectId === project.id,
  );
}
