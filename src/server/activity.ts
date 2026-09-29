import type { ActivityRepository } from "./activity-repository.ts";
export { recordActivity } from "./activity-record.ts";
import { getProject } from "./project.ts";
import type { ProjectRepository } from "./project-repository.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

export type ActivityDeps = {
  workspaces: WorkspaceRepository;
  projects: ProjectRepository;
  activities: ActivityRepository;
};

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
