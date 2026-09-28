import { z } from "zod";
import { recommendedShootChecklist } from "./checklist-defaults.ts";
import { NotFoundError, ValidationError } from "./errors.ts";
import {
  checklistTypes,
  type ChecklistRepository,
  type ChecklistTemplateRecord,
} from "./checklist-repository.ts";
import { parseInput } from "./validation.ts";
import { requireMembership, requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

// A spec dá templates ao dono (configurar) e ao admin (criar).
const managers = ["OWNER", "ADMIN"] as const;

const itemText = z
  .string({ error: "Escreva o item." })
  .trim()
  .min(1, "Escreva o item.")
  .max(200, "Use no máximo 200 caracteres.");

const templateSchema = z.object({
  name: z
    .string({ error: "Informe o nome." })
    .trim()
    .min(1, "Informe o nome.")
    .max(120, "Use no máximo 120 caracteres."),
  type: z.preprocess(
    (value) => (typeof value === "string" && value ? value : "SHOOT"),
    z.enum(checklistTypes, { error: "Escolha um tipo." }),
  ),
});

const itemsSchema = z.array(itemText).max(100, "Use no máximo 100 itens.");

function sameWorkspace(
  template: ChecklistTemplateRecord | null,
  workspaceId: string,
  templateId: string,
) {
  if (
    !template ||
    template.workspaceId !== workspaceId ||
    template.id !== templateId
  ) {
    throw new NotFoundError();
  }
  return template;
}

export async function listChecklistTemplates(
  userId: string,
  workspaceId: string,
  workspaces: WorkspaceRepository,
  checklists: ChecklistRepository,
) {
  const membership = await requireMembership(userId, workspaceId, workspaces);
  const rows = await checklists.list(membership.workspaceId);
  return rows.filter((row) => row.workspaceId === membership.workspaceId);
}

export async function getChecklistTemplate(
  userId: string,
  workspaceId: string,
  templateId: string,
  workspaces: WorkspaceRepository,
  checklists: ChecklistRepository,
) {
  const membership = await requireMembership(userId, workspaceId, workspaces);
  return sameWorkspace(
    await checklists.find(membership.workspaceId, templateId),
    membership.workspaceId,
    templateId,
  );
}

export async function createChecklistTemplate(
  userId: string,
  workspaceId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  checklists: ChecklistRepository,
  items: unknown = [],
) {
  const membership = await requireRole(
    userId,
    workspaceId,
    managers,
    workspaces,
  );
  const data = parseInput(templateSchema, input);
  const texts = parseInput(z.object({ items: itemsSchema }), { items }).items;
  const created = await checklists.create(membership.workspaceId, data, texts);
  if (created.workspaceId !== membership.workspaceId) throw new NotFoundError();
  return created;
}

export async function updateChecklistTemplate(
  userId: string,
  workspaceId: string,
  templateId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  checklists: ChecklistRepository,
) {
  const membership = await requireRole(
    userId,
    workspaceId,
    managers,
    workspaces,
  );
  const data = parseInput(templateSchema, input);
  return sameWorkspace(
    await checklists.update(membership.workspaceId, templateId, data),
    membership.workspaceId,
    templateId,
  );
}

// Apagar o template não mexe em checklist já copiado para uma gravação.
export async function deleteChecklistTemplate(
  userId: string,
  workspaceId: string,
  templateId: string,
  workspaces: WorkspaceRepository,
  checklists: ChecklistRepository,
) {
  const membership = await requireRole(
    userId,
    workspaceId,
    managers,
    workspaces,
  );
  const removed = await checklists.remove(membership.workspaceId, templateId);
  if (!removed) throw new NotFoundError();
}

export async function addChecklistItem(
  userId: string,
  workspaceId: string,
  templateId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  checklists: ChecklistRepository,
) {
  const membership = await requireRole(
    userId,
    workspaceId,
    managers,
    workspaces,
  );
  const { text } = parseInput(z.object({ text: itemText }), input);
  const current = sameWorkspace(
    await checklists.find(membership.workspaceId, templateId),
    membership.workspaceId,
    templateId,
  );
  if (current.items.length >= 100) {
    throw new ValidationError({ text: "Use no máximo 100 itens." });
  }
  return sameWorkspace(
    await checklists.addItem(membership.workspaceId, templateId, text),
    membership.workspaceId,
    templateId,
  );
}

export async function updateChecklistItem(
  userId: string,
  workspaceId: string,
  templateId: string,
  itemId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  checklists: ChecklistRepository,
) {
  const membership = await requireRole(
    userId,
    workspaceId,
    managers,
    workspaces,
  );
  const { text } = parseInput(z.object({ text: itemText }), input);
  return sameWorkspace(
    await checklists.updateItem(
      membership.workspaceId,
      templateId,
      itemId,
      text,
    ),
    membership.workspaceId,
    templateId,
  );
}

export async function removeChecklistItem(
  userId: string,
  workspaceId: string,
  templateId: string,
  itemId: string,
  workspaces: WorkspaceRepository,
  checklists: ChecklistRepository,
) {
  const membership = await requireRole(
    userId,
    workspaceId,
    managers,
    workspaces,
  );
  return sameWorkspace(
    await checklists.removeItem(membership.workspaceId, templateId, itemId),
    membership.workspaceId,
    templateId,
  );
}

export async function reorderChecklistItems(
  userId: string,
  workspaceId: string,
  templateId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  checklists: ChecklistRepository,
) {
  const membership = await requireRole(
    userId,
    workspaceId,
    managers,
    workspaces,
  );
  const { itemIds } = parseInput(
    z.object({ itemIds: z.array(z.string().trim().min(1)).max(100) }),
    input,
  );
  sameWorkspace(
    await checklists.find(membership.workspaceId, templateId),
    membership.workspaceId,
    templateId,
  );
  const reordered = await checklists.reorderItems(
    membership.workspaceId,
    templateId,
    itemIds,
  );
  if (!reordered) {
    throw new ValidationError({
      order: "A lista de itens mudou. Atualize a página.",
    });
  }
  return reordered;
}

// Cria o checklist da spec uma vez. Se já existe um com o mesmo nome e tipo,
// devolve o existente em vez de duplicar.
export async function createRecommendedChecklist(
  userId: string,
  workspaceId: string,
  workspaces: WorkspaceRepository,
  checklists: ChecklistRepository,
) {
  const membership = await requireRole(
    userId,
    workspaceId,
    managers,
    workspaces,
  );
  const existing = (await checklists.list(membership.workspaceId)).find(
    (row) =>
      row.workspaceId === membership.workspaceId &&
      row.type === recommendedShootChecklist.type &&
      row.name === recommendedShootChecklist.name,
  );
  if (existing) return existing;
  return createChecklistTemplate(
    userId,
    workspaceId,
    {
      name: recommendedShootChecklist.name,
      type: recommendedShootChecklist.type,
    },
    workspaces,
    checklists,
    recommendedShootChecklist.items,
  );
}
