import { z } from "zod";
import { NotFoundError } from "./errors.ts";
import type {
  ContinuityNoteWrite,
  ContinuityRepository,
} from "./continuity-repository.ts";
import { getProject } from "./project.ts";
import type { ProjectRepository } from "./project-repository.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

// Continuidade é anotada por quem está no set: membro escreve, leitor só vê.
const writers = ["OWNER", "ADMIN", "MEMBER"] as const;

export type ContinuityDeps = {
  workspaces: WorkspaceRepository;
  projects: ProjectRepository;
  continuity: ContinuityRepository;
};

const noteSchema = z.object({
  category: z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(60, "A categoria passou de 60 caracteres."),
  ),
  title: z
    .string({ error: "Informe o título." })
    .trim()
    .min(1, "Informe o título.")
    .max(120, "Use no máximo 120 caracteres."),
  description: z
    .string({ error: "Descreva a continuidade." })
    .trim()
    .min(1, "Descreva a continuidade.")
    .max(2000, "A descrição passou de 2000 caracteres."),
});

function toWrite(input: unknown): ContinuityNoteWrite {
  const data = parseInput(noteSchema, input);
  return {
    category: data.category ? data.category : null,
    title: data.title,
    description: data.description,
  };
}

async function projectScope(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: ContinuityDeps,
) {
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    deps.workspaces,
    deps.projects,
  );
  return { workspaceId: project.workspaceId, projectId: project.id };
}

export async function listContinuityNotes(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: ContinuityDeps,
) {
  const scope = await projectScope(userId, workspaceId, projectId, deps);
  const rows = await deps.continuity.list(scope.workspaceId, scope.projectId);
  return rows.filter((note) => note.videoProjectId === scope.projectId);
}

// Agrupa por categoria em ordem alfabética; sem categoria vai por último.
export function groupContinuityNotes<T extends { category: string | null }>(
  notes: T[],
) {
  const groups = new Map<string, T[]>();
  for (const note of notes) {
    const key = note.category ?? "";
    groups.set(key, [...(groups.get(key) ?? []), note]);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => {
      if (left === right) return 0;
      if (!left) return 1;
      if (!right) return -1;
      return left.localeCompare(right, "pt-BR");
    })
    .map(([category, items]) => ({ category: category || null, items }));
}

export async function createContinuityNote(
  userId: string,
  workspaceId: string,
  projectId: string,
  input: unknown,
  deps: ContinuityDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const data = toWrite(input);
  const scope = await projectScope(userId, workspaceId, projectId, deps);
  const created = await deps.continuity.create(
    scope.workspaceId,
    scope.projectId,
    { ...data, createdById: userId },
  );
  if (!created || created.videoProjectId !== scope.projectId) {
    throw new NotFoundError();
  }
  return created;
}

export async function updateContinuityNote(
  userId: string,
  workspaceId: string,
  projectId: string,
  noteId: string,
  input: unknown,
  deps: ContinuityDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const data = toWrite(input);
  const scope = await projectScope(userId, workspaceId, projectId, deps);
  const updated = await deps.continuity.update(
    scope.workspaceId,
    scope.projectId,
    noteId,
    data,
  );
  if (
    !updated ||
    updated.id !== noteId ||
    updated.videoProjectId !== scope.projectId
  ) {
    throw new NotFoundError();
  }
  return updated;
}

export async function deleteContinuityNote(
  userId: string,
  workspaceId: string,
  projectId: string,
  noteId: string,
  deps: ContinuityDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const scope = await projectScope(userId, workspaceId, projectId, deps);
  const removed = await deps.continuity.remove(
    scope.workspaceId,
    scope.projectId,
    noteId,
  );
  if (!removed) throw new NotFoundError();
}
