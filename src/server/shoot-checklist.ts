import { z } from "zod";
import { NotFoundError, ValidationError } from "./errors.ts";
import { getShoot, type ShootDeps } from "./shoot.ts";
import type {
  ShootChecklistRepository,
  ShootChecklistScope,
} from "./shoot-checklist-repository.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";

// Membro participa da gravação, então instancia e marca o checklist.
const writers = ["OWNER", "ADMIN", "MEMBER"] as const;

export type ShootChecklistDeps = ShootDeps & {
  shootChecklist: ShootChecklistRepository;
};

async function shootScope(
  userId: string,
  workspaceId: string,
  projectId: string,
  shootId: string,
  deps: ShootChecklistDeps,
): Promise<ShootChecklistScope> {
  const shoot = await getShoot(userId, workspaceId, projectId, shootId, deps);
  return { workspaceId, projectId: shoot.videoProjectId, shootId: shoot.id };
}

export async function listShootChecklist(
  userId: string,
  workspaceId: string,
  projectId: string,
  shootId: string,
  deps: ShootChecklistDeps,
) {
  const scope = await shootScope(userId, workspaceId, projectId, shootId, deps);
  const rows = await deps.shootChecklist.list(scope);
  return rows.filter((row) => row.shootId === scope.shootId);
}

export async function instantiateShootChecklist(
  userId: string,
  workspaceId: string,
  projectId: string,
  shootId: string,
  input: unknown,
  deps: ShootChecklistDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const scope = await shootScope(userId, workspaceId, projectId, shootId, deps);
  const { templateId } = parseInput(
    z.object({
      templateId: z
        .string({ error: "Escolha um checklist." })
        .trim()
        .min(1, "Escolha um checklist."),
    }),
    input,
  );
  const rows = await deps.shootChecklist.copyFromTemplate(scope, templateId);
  // Modelo de outro workspace cai aqui como se não existisse.
  if (!rows) {
    throw new ValidationError({ templateId: "Escolha um checklist." });
  }
  return rows.filter((row) => row.shootId === scope.shootId);
}

export async function setShootChecklistItem(
  userId: string,
  workspaceId: string,
  projectId: string,
  shootId: string,
  itemId: string,
  input: unknown,
  deps: ShootChecklistDeps,
  now = new Date(),
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const scope = await shootScope(userId, workspaceId, projectId, shootId, deps);
  const { completed } = parseInput(
    z.object({
      completed: z.preprocess(
        (value) => value === true || value === "on" || value === "true",
        z.boolean(),
      ),
    }),
    input,
  );
  // Quem marcou e quando vêm da sessão e do servidor, nunca do cliente.
  const updated = await deps.shootChecklist.setCompleted(
    scope,
    itemId,
    completed ? { userId, at: now } : null,
  );
  if (!updated || updated.id !== itemId || updated.shootId !== scope.shootId) {
    throw new NotFoundError();
  }
  return updated;
}
