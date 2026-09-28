import { NotFoundError } from "./errors.ts";
import { getShot, type ShotDeps } from "./shot.ts";
import type { TakeRepository, TakeScope } from "./take-repository.ts";

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
