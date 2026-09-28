import { z } from "zod";
import { NotFoundError, ValidationError } from "./errors.ts";
import type { ProjectRepository } from "./project-repository.ts";
import { getScene } from "./scene.ts";
import type { SceneRepository } from "./scene-repository.ts";
import { shotStatuses, shotTypes, type ShotStatus } from "./shot-labels.ts";
import type {
  ShotRepository,
  ShotScope,
  ShotWrite,
} from "./shot-repository.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

const writers = ["OWNER", "ADMIN", "MEMBER"] as const;

export type ShotDeps = {
  workspaces: WorkspaceRepository;
  projects: ProjectRepository;
  scenes: SceneRepository;
  shots: ShotRepository;
};

const optionalText = (max: number, message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(max, message),
  );

const shotSchema = z.object({
  name: optionalText(120, "Use no máximo 120 caracteres."),
  cameraLabel: optionalText(80, "A câmera passou de 80 caracteres."),
  shotType: z.preprocess(
    (value) => (typeof value === "string" && value ? value : "CAMERA"),
    z.enum(shotTypes, { error: "Escolha um tipo." }),
  ),
  framing: optionalText(80, "O enquadramento passou de 80 caracteres."),
  angle: optionalText(80, "O ângulo passou de 80 caracteres."),
  subject: optionalText(120, "O assunto passou de 120 caracteres."),
  movement: optionalText(80, "O movimento passou de 80 caracteres."),
  description: optionalText(2000, "A descrição passou de 2000 caracteres."),
  requiredTakes: z.preprocess(
    (value) => (value == null || value === "" ? 1 : Number(value)),
    z
      .number({ error: "Informe um número de takes." })
      .int("Informe um número inteiro.")
      .min(1, "Peça pelo menos 1 take.")
      .max(99, "Use no máximo 99 takes."),
  ),
  notes: optionalText(2000, "As notas passaram de 2000 caracteres."),
});

function blank(value: string) {
  return value ? value : null;
}

export function toShotWrite(input: unknown, status: ShotStatus): ShotWrite {
  const data = parseInput(shotSchema, input);
  return {
    name: blank(data.name),
    cameraLabel: blank(data.cameraLabel),
    shotType: data.shotType,
    framing: blank(data.framing),
    angle: blank(data.angle),
    subject: blank(data.subject),
    movement: blank(data.movement),
    description: blank(data.description),
    requiredTakes: data.requiredTakes,
    notes: blank(data.notes),
    status,
  };
}

// A cena passa pela mesma checagem de workspace e produção antes de
// qualquer leitura de shot.
export async function sceneScope(
  userId: string,
  workspaceId: string,
  projectId: string,
  sceneId: string,
  deps: ShotDeps,
): Promise<ShotScope> {
  const scene = await getScene(
    userId,
    workspaceId,
    projectId,
    sceneId,
    deps.workspaces,
    deps.projects,
    deps.scenes,
  );
  return { workspaceId, projectId: scene.videoProjectId, sceneId: scene.id };
}

export async function listShots(
  userId: string,
  workspaceId: string,
  projectId: string,
  sceneId: string,
  deps: ShotDeps,
) {
  const scope = await sceneScope(userId, workspaceId, projectId, sceneId, deps);
  const rows = await deps.shots.list(scope);
  return rows.filter((shot) => shot.sceneId === scope.sceneId);
}

export async function getShot(
  userId: string,
  workspaceId: string,
  projectId: string,
  sceneId: string,
  shotId: string,
  deps: ShotDeps,
) {
  const scope = await sceneScope(userId, workspaceId, projectId, sceneId, deps);
  const shot = await deps.shots.find(scope, shotId);
  if (!shot || shot.id !== shotId || shot.sceneId !== scope.sceneId) {
    throw new NotFoundError();
  }
  return shot;
}

export async function createShot(
  userId: string,
  workspaceId: string,
  projectId: string,
  sceneId: string,
  input: unknown,
  deps: ShotDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const scope = await sceneScope(userId, workspaceId, projectId, sceneId, deps);
  const created = await deps.shots.create(scope, toShotWrite(input, "PLANNED"));
  if (
    !created ||
    created.sceneId !== scope.sceneId ||
    created.status !== "PLANNED"
  ) {
    throw new NotFoundError();
  }
  return created;
}

const statusSchema = z.object({
  status: z.preprocess(
    (value) => (typeof value === "string" && value ? value : undefined),
    z.enum(shotStatuses, { error: "Escolha um status." }).optional(),
  ),
});

export async function updateShot(
  userId: string,
  workspaceId: string,
  projectId: string,
  sceneId: string,
  shotId: string,
  input: unknown,
  deps: ShotDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const current = await getShot(
    userId,
    workspaceId,
    projectId,
    sceneId,
    shotId,
    deps,
  );
  const scope = await sceneScope(userId, workspaceId, projectId, sceneId, deps);
  const status = parseInput(statusSchema, input).status ?? current.status;
  const updated = await deps.shots.update(
    scope,
    current.id,
    toShotWrite(input, status),
  );
  if (
    !updated ||
    updated.id !== current.id ||
    updated.sceneId !== current.sceneId ||
    updated.order !== current.order
  ) {
    throw new NotFoundError();
  }
  return updated;
}

export async function deleteShot(
  userId: string,
  workspaceId: string,
  projectId: string,
  sceneId: string,
  shotId: string,
  deps: ShotDeps,
  deletedAt = new Date(),
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const current = await getShot(
    userId,
    workspaceId,
    projectId,
    sceneId,
    shotId,
    deps,
  );
  const scope = await sceneScope(userId, workspaceId, projectId, sceneId, deps);
  const removed = await deps.shots.softDelete(scope, current.id, deletedAt);
  if (!removed) throw new NotFoundError();
}

const orderSchema = z.object({
  shotIds: z.array(z.string().trim().min(1)).max(200),
});

export async function reorderShots(
  userId: string,
  workspaceId: string,
  projectId: string,
  sceneId: string,
  input: unknown,
  deps: ShotDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const scope = await sceneScope(userId, workspaceId, projectId, sceneId, deps);
  const ids = parseInput(orderSchema, input).shotIds;
  const rows = await deps.shots.reorder(scope, ids);
  if (!rows) {
    throw new ValidationError({
      order: "A lista de shots mudou. Atualize a página.",
    });
  }
  if (
    rows.length !== ids.length ||
    rows.some(
      (row, index) =>
        row.id !== ids[index] ||
        row.order !== index + 1 ||
        row.sceneId !== scope.sceneId,
    )
  ) {
    throw new NotFoundError();
  }
  return rows;
}
