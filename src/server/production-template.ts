import { z } from "zod";
import { NotFoundError } from "./errors.ts";
import type {
  ProductionTemplateRepository,
  ProductionTemplateWrite,
} from "./production-template-repository.ts";
import { parseInput } from "./validation.ts";
import { requireMembership, requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

// A spec dá "configurar templates" ao dono e "criar templates" ao admin.
// Membro e leitor usam o template, mas não mudam.
const managers = ["OWNER", "ADMIN"] as const;

export type ProductionTemplateDeps = {
  workspaces: WorkspaceRepository;
  templates: ProductionTemplateRepository;
};

const templateSchema = z.object({
  name: z
    .string({ error: "Informe o nome." })
    .trim()
    .min(1, "Informe o nome.")
    .max(120, "Use no máximo 120 caracteres."),
  description: z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(2000, "A descrição passou de 2000 caracteres."),
  ),
});

function toWrite(input: unknown): ProductionTemplateWrite {
  const data = parseInput(templateSchema, input);
  return {
    name: data.name,
    description: data.description ? data.description : null,
  };
}

export async function listProductionTemplates(
  userId: string,
  workspaceId: string,
  deps: ProductionTemplateDeps,
) {
  const membership = await requireMembership(
    userId,
    workspaceId,
    deps.workspaces,
  );
  const rows = await deps.templates.list(membership.workspaceId);
  return rows.filter((row) => row.workspaceId === membership.workspaceId);
}

export async function getProductionTemplate(
  userId: string,
  workspaceId: string,
  templateId: string,
  deps: ProductionTemplateDeps,
) {
  const membership = await requireMembership(
    userId,
    workspaceId,
    deps.workspaces,
  );
  const row = await deps.templates.find(membership.workspaceId, templateId);
  if (
    !row ||
    row.id !== templateId ||
    row.workspaceId !== membership.workspaceId
  ) {
    throw new NotFoundError();
  }
  return row;
}

export async function createProductionTemplate(
  userId: string,
  workspaceId: string,
  input: unknown,
  deps: ProductionTemplateDeps,
) {
  const membership = await requireRole(
    userId,
    workspaceId,
    managers,
    deps.workspaces,
  );
  const created = await deps.templates.create(membership.workspaceId, {
    ...toWrite(input),
    createdById: userId,
  });
  if (created.workspaceId !== membership.workspaceId) throw new NotFoundError();
  return created;
}

export async function updateProductionTemplate(
  userId: string,
  workspaceId: string,
  templateId: string,
  input: unknown,
  deps: ProductionTemplateDeps,
) {
  const membership = await requireRole(
    userId,
    workspaceId,
    managers,
    deps.workspaces,
  );
  const updated = await deps.templates.update(
    membership.workspaceId,
    templateId,
    toWrite(input),
  );
  if (!updated || updated.id !== templateId) throw new NotFoundError();
  return updated;
}

// Excluir o template não mexe nas produções criadas com ele: elas receberam
// cópias, não referências.
export async function deleteProductionTemplate(
  userId: string,
  workspaceId: string,
  templateId: string,
  deps: ProductionTemplateDeps,
) {
  const membership = await requireRole(
    userId,
    workspaceId,
    managers,
    deps.workspaces,
  );
  const removed = await deps.templates.remove(
    membership.workspaceId,
    templateId,
  );
  if (!removed) throw new NotFoundError();
}
