import { z } from "zod";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { ideaFormats } from "./idea-labels.ts";
import type { IdeaRepository } from "./idea-repository.ts";
import { aspectRatios, projectPriorities } from "./project-labels.ts";
import type { ParticipantRepository } from "./participant-repository.ts";
import {
  filterProjects,
  type ProjectSearch,
} from "./project-search.ts";
import type { ProjectRepository, ProjectWrite } from "./project-repository.ts";
import { parseInput } from "./validation.ts";
import { requireMembership, requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

const writers = ["OWNER", "ADMIN", "MEMBER"] as const;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalText = (max: number, message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(max, message),
  );

const projectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Informe o título.")
    .max(120, "Use no máximo 120 caracteres."),
  slug: optionalText(60, "Use no máximo 60 caracteres."),
  description: optionalText(4000, "A descrição passou de 4000 caracteres."),
  objective: optionalText(200, "O objetivo passou de 200 caracteres."),
  audience: optionalText(200, "O público passou de 200 caracteres."),
  product: optionalText(200, "O produto passou de 200 caracteres."),
  format: z.enum(ideaFormats, { error: "Escolha um formato." }),
  aspectRatio: z.preprocess(
    (value) => (typeof value === "string" && value ? value : "NINE_SIXTEEN"),
    z.enum(aspectRatios, { error: "Escolha uma proporção." }),
  ),
  estimatedDurationSeconds: z.preprocess(
    (value) => (value == null || value === "" ? undefined : Number(value)),
    z
      .number()
      .int()
      .min(1, "A duração precisa ser de pelo menos 1 segundo.")
      .max(86400, "A duração passou de 24 horas.")
      .optional(),
  ),
  priority: z.preprocess(
    (value) => (typeof value === "string" && value ? value : "NORMAL"),
    z.enum(projectPriorities, { error: "Escolha uma prioridade." }),
  ),
  thumbnailUrl: optionalText(500, "A URL passou de 500 caracteres."),
  ownerId: optionalText(80, "Responsável inválido."),
  plannedShootDate: optionalText(40, "Data de gravação inválida."),
  plannedPublishDate: optionalText(40, "Data de publicação inválida."),
  sourceIdeaId: optionalText(80, "Ideia inválida."),
});

function blank(value: string | undefined) {
  if (!value) return null;
  return value;
}

function httpUrl(value: string | undefined, field: string) {
  const url = blank(value);
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
  } catch {
    // validação abaixo
  }
  throw new ValidationError({ [field]: "Informe uma URL http(s) válida." });
}

function utcDate(value: string | undefined, field: string) {
  const text = blank(value);
  if (!text) return null;
  if (
    !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/.test(
      text,
    )
  ) {
    throw new ValidationError({ [field]: "Use uma data em ISO 8601." });
  }
  const date = new Date(text.length === 10 ? `${text}T00:00:00.000Z` : text);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError({ [field]: "Use uma data em ISO 8601." });
  }
  return date;
}

async function toWrite(
  userId: string,
  workspaceId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  ideas: IdeaRepository,
  projects: ProjectRepository,
  exceptId?: string,
): Promise<ProjectWrite> {
  const data = parseInput(projectSchema, input);
  const slug = blank(data.slug);
  if (slug && !slugPattern.test(slug)) {
    throw new ValidationError({
      slug: "Use letras minúsculas, números e hífen.",
    });
  }
  if (slug) {
    const taken = await projects.findBySlug(workspaceId, slug);
    if (taken && taken.id !== exceptId) {
      throw new ValidationError({ slug: "Este identificador já está em uso." });
    }
  }

  const ownerId = blank(data.ownerId);
  if (ownerId) {
    const membership = await workspaces.findMembership(ownerId, workspaceId);
    if (!membership || membership.workspaceId !== workspaceId) {
      throw new ValidationError({
        ownerId: "Essa pessoa não está neste workspace.",
      });
    }
  }

  const sourceIdeaId = blank(data.sourceIdeaId);
  if (sourceIdeaId) {
    const idea = await ideas.find(workspaceId, sourceIdeaId);
    if (!idea || idea.workspaceId !== workspaceId) {
      throw new ValidationError({
        sourceIdeaId: "A ideia não está neste workspace.",
      });
    }
  }

  return {
    title: data.title,
    slug,
    description: blank(data.description),
    objective: blank(data.objective),
    audience: blank(data.audience),
    product: blank(data.product),
    format: data.format,
    aspectRatio: data.aspectRatio,
    estimatedDurationSeconds: data.estimatedDurationSeconds ?? null,
    status: "IDEA",
    priority: data.priority,
    thumbnailUrl: httpUrl(data.thumbnailUrl, "thumbnailUrl"),
    ownerId,
    plannedShootDate: utcDate(data.plannedShootDate, "plannedShootDate"),
    plannedPublishDate: utcDate(data.plannedPublishDate, "plannedPublishDate"),
    sourceIdeaId,
  };
}

export async function listProjects(
  userId: string,
  workspaceId: string,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
) {
  await requireMembership(userId, workspaceId, workspaces);
  const rows = await projects.list(workspaceId);
  return rows.filter((project) => project.workspaceId === workspaceId);
}

export async function searchProjects(
  userId: string,
  workspaceId: string,
  query: ProjectSearch,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
  participants: ParticipantRepository,
) {
  const rows = await listProjects(userId, workspaceId, workspaces, projects);
  const memberships = await participants.listByProjectIds(rows.map((row) => row.id));
  return filterProjects(rows, memberships, query).filter(
    (project) => project.workspaceId === workspaceId,
  );
}

export async function getProject(
  userId: string,
  workspaceId: string,
  projectId: string,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
) {
  await requireMembership(userId, workspaceId, workspaces);
  const project = await projects.find(workspaceId, projectId);
  if (!project || project.workspaceId !== workspaceId)
    throw new NotFoundError();
  return project;
}

export async function createProject(
  userId: string,
  workspaceId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  ideas: IdeaRepository,
  projects: ProjectRepository,
) {
  await requireRole(userId, workspaceId, writers, workspaces);
  const created = await projects.create(
    workspaceId,
    userId,
    await toWrite(userId, workspaceId, input, workspaces, ideas, projects),
  );
  if (created.createdById !== userId || created.workspaceId !== workspaceId) {
    throw new ForbiddenError();
  }
  if (created.status !== "IDEA") throw new ForbiddenError();
  return created;
}

export async function updateProject(
  userId: string,
  workspaceId: string,
  projectId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  ideas: IdeaRepository,
  projects: ProjectRepository,
) {
  await requireRole(userId, workspaceId, writers, workspaces);
  const current = await getProject(
    userId,
    workspaceId,
    projectId,
    workspaces,
    projects,
  );
  const write = await toWrite(
    userId,
    workspaceId,
    input,
    workspaces,
    ideas,
    projects,
    current.id,
  );
  write.status = current.status;
  const updated = await projects.update(workspaceId, projectId, write);
  if (
    !updated ||
    updated.id !== projectId ||
    updated.workspaceId !== workspaceId
  ) {
    throw new NotFoundError();
  }
  if (
    updated.status !== current.status ||
    updated.createdById !== current.createdById
  ) {
    throw new ForbiddenError();
  }
  return updated;
}

export async function convertIdeaToProject(
  userId: string,
  workspaceId: string,
  ideaId: string,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
) {
  await requireRole(userId, workspaceId, writers, workspaces);
  const project = await projects.convert(workspaceId, userId, ideaId);
  if (
    project.createdById !== userId ||
    project.workspaceId !== workspaceId ||
    project.sourceIdeaId !== ideaId ||
    project.status !== "IDEA"
  ) {
    throw new ForbiddenError();
  }
  return project;
}

export async function projectFromIdea(
  userId: string,
  workspaceId: string,
  ideaId: string,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
) {
  await requireMembership(userId, workspaceId, workspaces);
  const project = await projects.findBySourceIdea(workspaceId, ideaId);
  if (!project || project.workspaceId !== workspaceId) return null;
  return project;
}

export async function deleteProject(
  userId: string,
  workspaceId: string,
  projectId: string,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
  deletedAt = new Date(),
) {
  await requireRole(userId, workspaceId, writers, workspaces);
  await getProject(userId, workspaceId, projectId, workspaces, projects);
  const removed = await projects.softDelete(workspaceId, projectId, deletedAt);
  if (!removed) throw new NotFoundError();
}
