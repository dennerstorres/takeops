import { z } from "zod";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { ideaFormats, type IdeaFormat } from "./idea-labels.ts";
import type { IdeaRepository, IdeaWrite } from "./idea-repository.ts";
import { parseInput } from "./validation.ts";
import { requireMembership, requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

const writers = ["OWNER", "ADMIN", "MEMBER"] as const;

const optionalText = (max: number, message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(max, message),
  );

const ideaSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Informe o título.")
    .max(120, "Use no máximo 120 caracteres."),
  description: optionalText(4000, "A descrição passou de 4000 caracteres."),
  format: z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.union([
      z.literal(""),
      z.enum(ideaFormats, { error: "Escolha um formato." }),
    ]),
  ),
  objective: optionalText(200, "O objetivo passou de 200 caracteres."),
  product: optionalText(200, "O produto passou de 200 caracteres."),
  audience: optionalText(200, "O público passou de 200 caracteres."),
  referenceUrl: optionalText(500, "A URL passou de 500 caracteres."),
  notes: optionalText(4000, "As notas passaram de 4000 caracteres."),
});

function blank(value: string | undefined) {
  if (!value) return null;
  return value;
}

function httpUrl(value: string | undefined) {
  const url = blank(value);
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
  } catch {
    // validação abaixo
  }
  throw new ValidationError({
    referenceUrl: "Informe uma URL http(s) válida.",
  });
}

function toWrite(input: unknown): IdeaWrite {
  const data = parseInput(ideaSchema, input);
  return {
    title: data.title,
    description: blank(data.description),
    format: data.format ? (data.format as IdeaFormat) : null,
    objective: blank(data.objective),
    product: blank(data.product),
    audience: blank(data.audience),
    referenceUrl: httpUrl(data.referenceUrl),
    notes: blank(data.notes),
  };
}

async function visible(
  userId: string,
  workspaceId: string,
  ideaId: string,
  workspaces: WorkspaceRepository,
  ideas: IdeaRepository,
) {
  await requireMembership(userId, workspaceId, workspaces);
  const idea = await ideas.find(workspaceId, ideaId);
  if (!idea || idea.workspaceId !== workspaceId) throw new NotFoundError();
  return idea;
}

export async function listIdeas(
  userId: string,
  workspaceId: string,
  workspaces: WorkspaceRepository,
  ideas: IdeaRepository,
) {
  await requireMembership(userId, workspaceId, workspaces);
  const rows = await ideas.list(workspaceId);
  return rows.filter((idea) => idea.workspaceId === workspaceId);
}

export async function getIdea(
  userId: string,
  workspaceId: string,
  ideaId: string,
  workspaces: WorkspaceRepository,
  ideas: IdeaRepository,
) {
  return visible(userId, workspaceId, ideaId, workspaces, ideas);
}

export async function createIdea(
  userId: string,
  workspaceId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  ideas: IdeaRepository,
) {
  await requireRole(userId, workspaceId, writers, workspaces);
  const created = await ideas.create(workspaceId, userId, toWrite(input));
  if (created.authorId !== userId || created.workspaceId !== workspaceId) {
    throw new ForbiddenError();
  }
  if (created.status !== "NEW") throw new ForbiddenError();
  return created;
}

export async function updateIdea(
  userId: string,
  workspaceId: string,
  ideaId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  ideas: IdeaRepository,
) {
  await requireRole(userId, workspaceId, writers, workspaces);
  const current = await visible(userId, workspaceId, ideaId, workspaces, ideas);
  const updated = await ideas.update(workspaceId, ideaId, toWrite(input));
  if (
    !updated ||
    updated.id !== ideaId ||
    updated.workspaceId !== workspaceId
  ) {
    throw new NotFoundError();
  }
  if (
    updated.status !== current.status ||
    updated.authorId !== current.authorId
  ) {
    throw new ForbiddenError();
  }
  return updated;
}

export async function deleteIdea(
  userId: string,
  workspaceId: string,
  ideaId: string,
  workspaces: WorkspaceRepository,
  ideas: IdeaRepository,
  deletedAt = new Date(),
) {
  await requireRole(userId, workspaceId, writers, workspaces);
  await visible(userId, workspaceId, ideaId, workspaces, ideas);
  const removed = await ideas.softDelete(workspaceId, ideaId, deletedAt);
  if (!removed) throw new NotFoundError();
}
