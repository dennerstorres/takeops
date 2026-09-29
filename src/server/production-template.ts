import { z } from "zod";
import { NotFoundError, ValidationError } from "./errors.ts";
import type {
  ProductionTemplateRepository,
  ProductionTemplateWrite,
} from "./production-template-repository.ts";
import { sceneTypes } from "./scene-labels.ts";
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

const sceneSchema = z.object({
  title: z
    .string({ error: "Informe o título da cena." })
    .trim()
    .min(1, "Informe o título da cena.")
    .max(120, "Use no máximo 120 caracteres."),
  type: z.enum(sceneTypes, { error: "Escolha um tipo." }),
  description: z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(2000, "A descrição passou de 2000 caracteres."),
  ),
});

const moveSchema = z.object({
  direction: z.enum(["up", "down"], { error: "Direção inválida." }),
});

export async function listTemplateScenes(
  userId: string,
  workspaceId: string,
  templateId: string,
  deps: ProductionTemplateDeps,
) {
  const template = await getProductionTemplate(
    userId,
    workspaceId,
    templateId,
    deps,
  );
  const scenes = await deps.templates.listScenes(
    template.workspaceId,
    template.id,
  );
  if (!scenes) throw new NotFoundError();
  return scenes.filter((scene) => scene.templateId === template.id);
}

async function managedTemplate(
  userId: string,
  workspaceId: string,
  templateId: string,
  deps: ProductionTemplateDeps,
) {
  await requireRole(userId, workspaceId, managers, deps.workspaces);
  return getProductionTemplate(userId, workspaceId, templateId, deps);
}

function sceneResult<T extends { templateId: string }>(
  scenes: T[] | null,
  templateId: string,
) {
  if (!scenes || scenes.some((scene) => scene.templateId !== templateId)) {
    throw new NotFoundError();
  }
  return scenes;
}

export async function addTemplateScene(
  userId: string,
  workspaceId: string,
  templateId: string,
  input: unknown,
  deps: ProductionTemplateDeps,
) {
  const template = await managedTemplate(userId, workspaceId, templateId, deps);
  const data = parseInput(sceneSchema, input);
  return sceneResult(
    await deps.templates.addScene(template.workspaceId, template.id, {
      title: data.title,
      type: data.type,
      description: data.description ? data.description : null,
    }),
    template.id,
  );
}

export async function removeTemplateScene(
  userId: string,
  workspaceId: string,
  templateId: string,
  sceneId: string,
  deps: ProductionTemplateDeps,
) {
  const template = await managedTemplate(userId, workspaceId, templateId, deps);
  return sceneResult(
    await deps.templates.removeScene(
      template.workspaceId,
      template.id,
      sceneId,
    ),
    template.id,
  );
}

export async function moveTemplateScene(
  userId: string,
  workspaceId: string,
  templateId: string,
  sceneId: string,
  input: unknown,
  deps: ProductionTemplateDeps,
) {
  const template = await managedTemplate(userId, workspaceId, templateId, deps);
  const { direction } = parseInput(moveSchema, input);
  return sceneResult(
    await deps.templates.moveScene(
      template.workspaceId,
      template.id,
      sceneId,
      direction,
    ),
    template.id,
  );
}

const checklistSchema = z.object({
  checklistTemplateId: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().max(80, "Checklist inválido."),
  ),
});

// Vazio tira o checklist do template. O checklist precisa ser do mesmo
// workspace; a produção criada recebe cópia dos itens (TEMPLATE-004).
export async function setTemplateChecklist(
  userId: string,
  workspaceId: string,
  templateId: string,
  input: unknown,
  deps: ProductionTemplateDeps,
) {
  const template = await managedTemplate(userId, workspaceId, templateId, deps);
  const { checklistTemplateId } = parseInput(checklistSchema, input);
  const updated = await deps.templates.setChecklist(
    template.workspaceId,
    template.id,
    checklistTemplateId || null,
  );
  if (updated === "invalid") {
    throw new ValidationError({
      checklistTemplateId: "Escolha um checklist deste workspace.",
    });
  }
  if (!updated || updated.id !== template.id) throw new NotFoundError();
  return updated;
}
