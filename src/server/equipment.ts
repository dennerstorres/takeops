import { z } from "zod";
import { NotFoundError } from "./errors.ts";
import { equipmentCategories } from "./equipment-labels.ts";
import type {
  EquipmentRepository,
  EquipmentWrite,
} from "./equipment-repository.ts";
import { parseInput } from "./validation.ts";
import { requireMembership, requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

// Catálogo é configuração operacional do workspace: dono e admin mantêm.
// Membro usa o catálogo nas gravações, mas não o altera.
const managers = ["OWNER", "ADMIN"] as const;

const itemSchema = z.object({
  name: z
    .string({ error: "Informe o nome." })
    .trim()
    .min(1, "Informe o nome.")
    .max(120, "Use no máximo 120 caracteres."),
  category: z.enum(equipmentCategories, { error: "Escolha uma categoria." }),
  notes: z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(1000, "As notas passaram de 1000 caracteres."),
  ),
  // Checkbox manda "on" quando marcado e nada quando não.
  active: z.preprocess(
    (value) =>
      value === true || value === "on" || value === "true" ? true : false,
    z.boolean(),
  ),
});

function toWrite(input: unknown): EquipmentWrite {
  const data = parseInput(itemSchema, input);
  return {
    name: data.name,
    category: data.category,
    notes: data.notes ? data.notes : null,
    active: data.active,
  };
}

export async function listEquipment(
  userId: string,
  workspaceId: string,
  workspaces: WorkspaceRepository,
  equipment: EquipmentRepository,
) {
  const membership = await requireMembership(userId, workspaceId, workspaces);
  const rows = await equipment.list(membership.workspaceId);
  return rows.filter((item) => item.workspaceId === membership.workspaceId);
}

export async function createEquipment(
  userId: string,
  workspaceId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  equipment: EquipmentRepository,
) {
  const membership = await requireRole(
    userId,
    workspaceId,
    managers,
    workspaces,
  );
  // Item novo entra ativo, mesmo que o envio diga o contrário.
  const created = await equipment.create(
    membership.workspaceId,
    toWrite({ ...asObject(input), active: true }),
  );
  if (created.workspaceId !== membership.workspaceId) throw new NotFoundError();
  return created;
}

export async function updateEquipment(
  userId: string,
  workspaceId: string,
  itemId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  equipment: EquipmentRepository,
) {
  const membership = await requireRole(
    userId,
    workspaceId,
    managers,
    workspaces,
  );
  const current = await equipment.find(membership.workspaceId, itemId);
  if (!current || current.workspaceId !== membership.workspaceId) {
    throw new NotFoundError();
  }
  const updated = await equipment.update(
    membership.workspaceId,
    current.id,
    toWrite(input),
  );
  if (!updated || updated.id !== current.id) throw new NotFoundError();
  return updated;
}

function asObject(input: unknown) {
  return input && typeof input === "object" ? input : {};
}
