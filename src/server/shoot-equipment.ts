import { z } from "zod";
import { NotFoundError, ValidationError } from "./errors.ts";
import { getShoot, type ShootDeps } from "./shoot.ts";
import type {
  ShootEquipmentRepository,
  ShootEquipmentScope,
} from "./shoot-equipment-repository.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";

const writers = ["OWNER", "ADMIN", "MEMBER"] as const;

export type ShootEquipmentDeps = ShootDeps & {
  shootEquipment: ShootEquipmentRepository;
};

const flag = z.preprocess(
  (value) => value === true || value === "on" || value === "true",
  z.boolean(),
);

const notes = z.preprocess(
  (value) => (typeof value === "string" ? value : ""),
  z.string().trim().max(500, "As notas passaram de 500 caracteres."),
);

const addSchema = z.object({
  equipmentItemId: z
    .string({ error: "Escolha um equipamento." })
    .trim()
    .min(1, "Escolha um equipamento."),
  required: flag,
  notes,
});

const updateSchema = z.object({ required: flag, checked: flag, notes });

async function shootScope(
  userId: string,
  workspaceId: string,
  projectId: string,
  shootId: string,
  deps: ShootEquipmentDeps,
): Promise<ShootEquipmentScope> {
  const shoot = await getShoot(userId, workspaceId, projectId, shootId, deps);
  return { workspaceId, projectId: shoot.videoProjectId, shootId: shoot.id };
}

export async function listShootEquipment(
  userId: string,
  workspaceId: string,
  projectId: string,
  shootId: string,
  deps: ShootEquipmentDeps,
) {
  const scope = await shootScope(userId, workspaceId, projectId, shootId, deps);
  const rows = await deps.shootEquipment.list(scope);
  return rows.filter((row) => row.shootId === scope.shootId);
}

export async function addShootEquipment(
  userId: string,
  workspaceId: string,
  projectId: string,
  shootId: string,
  input: unknown,
  deps: ShootEquipmentDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const scope = await shootScope(userId, workspaceId, projectId, shootId, deps);
  const data = parseInput(addSchema, input);
  const added = await deps.shootEquipment.add(scope, {
    equipmentItemId: data.equipmentItemId,
    required: data.required,
    notes: data.notes ? data.notes : null,
  });
  if (added === "duplicate") {
    throw new ValidationError({
      equipmentItemId: "Esse equipamento já está nesta gravação.",
    });
  }
  // Item de outro workspace ou fora de uso cai aqui, sem dizer qual.
  if (!added) {
    throw new ValidationError({
      equipmentItemId: "Escolha um equipamento do catálogo em uso.",
    });
  }
  if (added.shootId !== scope.shootId) throw new NotFoundError();
  return added;
}

// Marcar como conferido faz parte da preparação: quem escreve pode.
export async function updateShootEquipment(
  userId: string,
  workspaceId: string,
  projectId: string,
  shootId: string,
  rowId: string,
  input: unknown,
  deps: ShootEquipmentDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const scope = await shootScope(userId, workspaceId, projectId, shootId, deps);
  const data = parseInput(updateSchema, input);
  const updated = await deps.shootEquipment.update(scope, rowId, {
    required: data.required,
    checked: data.checked,
    notes: data.notes ? data.notes : null,
  });
  if (!updated || updated.id !== rowId || updated.shootId !== scope.shootId) {
    throw new NotFoundError();
  }
  return updated;
}

export async function removeShootEquipment(
  userId: string,
  workspaceId: string,
  projectId: string,
  shootId: string,
  rowId: string,
  deps: ShootEquipmentDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const scope = await shootScope(userId, workspaceId, projectId, shootId, deps);
  const removed = await deps.shootEquipment.remove(scope, rowId);
  if (!removed) throw new NotFoundError();
}
