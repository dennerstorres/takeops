import { z } from "zod";
import { NotFoundError, ValidationError } from "./errors.ts";
import { getProject } from "./project.ts";
import type { ProjectRepository } from "./project-repository.ts";
import { shootStatuses, type ShootStatus } from "./shoot-labels.ts";
import type { ShootRepository, ShootWrite } from "./shoot-repository.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

const writers = ["OWNER", "ADMIN", "MEMBER"] as const;

export type ShootDeps = {
  workspaces: WorkspaceRepository;
  projects: ProjectRepository;
  shoots: ShootRepository;
};

const optionalText = (max: number, message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(max, message),
  );

// A API recebe instante com fuso explícito. Sem Z ou deslocamento o horário
// seria lido no fuso do servidor, que não é o do workspace.
const isoInstant =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

function instant(value: string, field: string) {
  const date = isoInstant.test(value) ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    throw new ValidationError({ [field]: "Informe data e hora válidas." });
  }
  return date;
}

const shootSchema = z.object({
  title: optionalText(120, "Use no máximo 120 caracteres."),
  scheduledAt: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().min(1, "Informe a data da gravação."),
  ),
  endAt: optionalText(40, "Informe data e hora válidas."),
  location: optionalText(200, "O local passou de 200 caracteres."),
  notes: optionalText(4000, "As notas passaram de 4000 caracteres."),
});

function blank(value: string) {
  return value ? value : null;
}

export function toShootWrite(input: unknown, status: ShootStatus): ShootWrite {
  const data = parseInput(shootSchema, input);
  const scheduledAt = instant(data.scheduledAt, "scheduledAt");
  const endAt = data.endAt ? instant(data.endAt, "endAt") : null;
  if (endAt && endAt.getTime() < scheduledAt.getTime()) {
    throw new ValidationError({
      endAt: "O fim precisa ser depois do início.",
    });
  }
  return {
    title: blank(data.title),
    scheduledAt,
    endAt,
    location: blank(data.location),
    notes: blank(data.notes),
    status,
  };
}

export async function listShoots(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: ShootDeps,
) {
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    deps.workspaces,
    deps.projects,
  );
  const rows = await deps.shoots.list(project.workspaceId, project.id);
  return rows.filter((shoot) => shoot.videoProjectId === project.id);
}

export async function getShoot(
  userId: string,
  workspaceId: string,
  projectId: string,
  shootId: string,
  deps: ShootDeps,
) {
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    deps.workspaces,
    deps.projects,
  );
  const shoot = await deps.shoots.find(
    project.workspaceId,
    project.id,
    shootId,
  );
  if (!shoot || shoot.id !== shootId || shoot.videoProjectId !== project.id) {
    throw new NotFoundError();
  }
  return shoot;
}

export async function createShoot(
  userId: string,
  workspaceId: string,
  projectId: string,
  input: unknown,
  deps: ShootDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    deps.workspaces,
    deps.projects,
  );
  const created = await deps.shoots.create(
    project.workspaceId,
    project.id,
    toShootWrite(input, "PLANNED"),
  );
  if (
    !created ||
    created.videoProjectId !== project.id ||
    created.status !== "PLANNED"
  ) {
    throw new NotFoundError();
  }
  return created;
}

const statusSchema = z.object({
  status: z.preprocess(
    (value) => (typeof value === "string" && value ? value : undefined),
    z.enum(shootStatuses, { error: "Escolha um status." }).optional(),
  ),
});

export async function updateShoot(
  userId: string,
  workspaceId: string,
  projectId: string,
  shootId: string,
  input: unknown,
  deps: ShootDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const current = await getShoot(userId, workspaceId, projectId, shootId, deps);
  const status = parseInput(statusSchema, input).status ?? current.status;
  const updated = await deps.shoots.update(
    workspaceId,
    current.videoProjectId,
    current.id,
    toShootWrite(input, status),
  );
  if (
    !updated ||
    updated.id !== current.id ||
    updated.videoProjectId !== current.videoProjectId
  ) {
    throw new NotFoundError();
  }
  return updated;
}

export async function deleteShoot(
  userId: string,
  workspaceId: string,
  projectId: string,
  shootId: string,
  deps: ShootDeps,
  deletedAt = new Date(),
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const current = await getShoot(userId, workspaceId, projectId, shootId, deps);
  const removed = await deps.shoots.softDelete(
    workspaceId,
    current.videoProjectId,
    current.id,
    deletedAt,
  );
  if (!removed) throw new NotFoundError();
}
