import { notify } from "./notification.ts";
import type { NotificationRepository } from "./notification-repository.ts";
import { z } from "zod";
import { NotFoundError, ValidationError } from "./errors.ts";
import { projectRoles } from "./participant-labels.ts";
import type { ParticipantRepository } from "./participant-repository.ts";
import { getProject } from "./project.ts";
import type { ProjectRepository } from "./project-repository.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

const writers = ["OWNER", "ADMIN", "MEMBER"] as const;

const assignmentSchema = z.object({
  userId: z.string().trim().min(1).max(80),
  role: z.enum(projectRoles, { error: "Escolha uma função." }),
});

export async function listParticipants(
  userId: string,
  workspaceId: string,
  projectId: string,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
  participants: ParticipantRepository,
) {
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    workspaces,
    projects,
  );
  const rows = await participants.list(project.id);
  return rows.filter((row) => row.videoProjectId === project.id);
}

export async function addParticipant(
  userId: string,
  workspaceId: string,
  projectId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
  participants: ParticipantRepository,
  notifications?: NotificationRepository,
) {
  await requireRole(userId, workspaceId, writers, workspaces);
  const data = parseInput(assignmentSchema, input);
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    workspaces,
    projects,
  );
  const member = await workspaces.findMembership(data.userId, workspaceId);
  if (!member || member.workspaceId !== workspaceId) {
    throw new ValidationError({
      userId: "Essa pessoa não está neste workspace.",
    });
  }
  const current = await participants.list(project.id);
  if (
    current.some(
      (row) =>
        row.userId === data.userId &&
        row.role === data.role &&
        row.videoProjectId === project.id,
    )
  ) {
    throw new ValidationError({
      role: "Esta pessoa já tem essa função.",
    });
  }
  const created = await participants.add(project.id, data.userId, data.role);
  if (created.videoProjectId !== project.id || created.role !== data.role) {
    throw new NotFoundError();
  }
  // Nova função para quem já participava não gera aviso de novo.
  if (!current.some((row) => row.userId === data.userId)) {
    await notify(
      notifications,
      {
        workspaceId,
        actorId: userId,
        videoProjectId: project.id,
        type: "PROJECT_MEMBER_ADDED",
        metadata: null,
      },
      [data.userId],
    );
  }
  return created;
}

export async function removeParticipant(
  userId: string,
  workspaceId: string,
  projectId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
  participants: ParticipantRepository,
) {
  await requireRole(userId, workspaceId, writers, workspaces);
  const data = parseInput(assignmentSchema, input);
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    workspaces,
    projects,
  );
  const removed = await participants.remove(project.id, data.userId, data.role);
  if (!removed) {
    throw new NotFoundError("Essa função não está nesta pessoa.");
  }
}
