import { z } from "zod";
import { NotFoundError, ValidationError } from "./errors.ts";
import { getShot, type ShotDeps } from "./shot.ts";
import {
  takeStatuses,
  type TakeRepository,
  type TakeScope,
} from "./take-repository.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";

// Membro registra takes: é participar da gravação.
const writers = ["OWNER", "ADMIN", "MEMBER"] as const;

const takeSchema = z.object({
  status: z.preprocess(
    (value) => (typeof value === "string" && value ? value : "OK"),
    z.enum(takeStatuses, { error: "Escolha um status." }),
  ),
  notes: z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(1000, "As notas passaram de 1000 caracteres."),
  ),
});

export type TakeDeps = ShotDeps & { takes: TakeRepository };

export type TakeTarget = {
  projectId: string;
  sceneId: string;
  shotId: string;
};

// O shot passa pela mesma checagem de workspace, produção e cena antes de
// qualquer leitura de take.
export async function takeScope(
  userId: string,
  workspaceId: string,
  target: TakeTarget,
  deps: TakeDeps,
): Promise<TakeScope> {
  const shot = await getShot(
    userId,
    workspaceId,
    target.projectId,
    target.sceneId,
    target.shotId,
    deps,
  );
  return {
    workspaceId,
    projectId: target.projectId,
    sceneId: shot.sceneId,
    shotId: shot.id,
  };
}

export async function listTakes(
  userId: string,
  workspaceId: string,
  target: TakeTarget,
  deps: TakeDeps,
) {
  const scope = await takeScope(userId, workspaceId, target, deps);
  const rows = await deps.takes.list(scope);
  return rows.filter((take) => take.shotId === scope.shotId);
}

export async function getTake(
  userId: string,
  workspaceId: string,
  target: TakeTarget,
  takeId: string,
  deps: TakeDeps,
) {
  const scope = await takeScope(userId, workspaceId, target, deps);
  const take = await deps.takes.find(scope, takeId);
  if (!take || take.id !== takeId || take.shotId !== scope.shotId) {
    throw new NotFoundError();
  }
  return take;
}

// Número, quem gravou e quando vêm do servidor. O cliente manda só status e
// notas.
export async function registerTake(
  userId: string,
  workspaceId: string,
  target: TakeTarget,
  input: unknown,
  deps: TakeDeps,
  now = new Date(),
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const scope = await takeScope(userId, workspaceId, target, deps);
  const data = parseInput(takeSchema, input);
  const created = await deps.takes.create(scope, {
    status: data.status,
    notes: data.notes ? data.notes : null,
    recordedById: userId,
    recordedAt: now,
  });
  if (!created || created.shotId !== scope.shotId) throw new NotFoundError();
  return created;
}

export async function updateTake(
  userId: string,
  workspaceId: string,
  target: TakeTarget,
  takeId: string,
  input: unknown,
  deps: TakeDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const current = await getTake(userId, workspaceId, target, takeId, deps);
  const scope = await takeScope(userId, workspaceId, target, deps);
  const data = parseInput(takeSchema, input);
  const updated = await deps.takes.update(scope, current.id, {
    status: data.status,
    notes: data.notes ? data.notes : null,
  });
  if (
    !updated ||
    updated.id !== current.id ||
    updated.number !== current.number
  ) {
    throw new NotFoundError();
  }
  return updated;
}

// Pode haver vários takes OK; só um é o preferido do shot.
export async function setFavoriteTake(
  userId: string,
  workspaceId: string,
  target: TakeTarget,
  takeId: string | null,
  deps: TakeDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const scope = await takeScope(userId, workspaceId, target, deps);
  if (takeId) await getTake(userId, workspaceId, target, takeId, deps);
  const rows = await deps.takes.setFavorite(scope, takeId);
  if (!rows) {
    throw new ValidationError({
      favorite: "Só um take OK pode ser o preferido.",
    });
  }
  return rows.filter((take) => take.shotId === scope.shotId);
}
