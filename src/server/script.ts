import { z } from "zod";
import { NotFoundError } from "./errors.ts";
import { getProject } from "./project.ts";
import type { ProjectRepository } from "./project-repository.ts";
import type { ScriptRepository, ScriptWrite } from "./script-repository.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

const writers = ["OWNER", "ADMIN", "MEMBER"] as const;

const optionalText = (max: number, message: string) =>
  z.preprocess(
    (value) => {
      if (value == null) return undefined;
      return typeof value === "string" ? value : "";
    },
    z.string().trim().max(max, message).optional(),
  );

const scriptSchema = z.object({
  hook: optionalText(2000, "O gancho passou de 2000 caracteres."),
  mainMessage: optionalText(2000, "A mensagem passou de 2000 caracteres."),
  cta: optionalText(2000, "A chamada passou de 2000 caracteres."),
  notes: optionalText(4000, "As notas passaram de 4000 caracteres."),
});

function merge(value: string | undefined, current: string | null) {
  if (value === undefined) return current;
  return value ? value : null;
}

function toWrite(input: unknown, current: ScriptWrite | null): ScriptWrite {
  const data = parseInput(scriptSchema, input);
  return {
    hook: merge(data.hook, current?.hook ?? null),
    mainMessage: merge(data.mainMessage, current?.mainMessage ?? null),
    cta: merge(data.cta, current?.cta ?? null),
    notes: merge(data.notes, current?.notes ?? null),
  };
}

export async function getScript(
  userId: string,
  workspaceId: string,
  projectId: string,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
  scripts: ScriptRepository,
) {
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    workspaces,
    projects,
  );
  const script = await scripts.find(project.workspaceId, project.id);
  if (!script || script.videoProjectId !== project.id) return null;
  return script;
}

export async function saveScript(
  userId: string,
  workspaceId: string,
  projectId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
  scripts: ScriptRepository,
) {
  await requireRole(userId, workspaceId, writers, workspaces);
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    workspaces,
    projects,
  );
  const found = await scripts.find(project.workspaceId, project.id);
  const current = found?.videoProjectId === project.id ? found : null;
  const saved = await scripts.save(
    project.workspaceId,
    project.id,
    toWrite(input, current),
  );
  if (!saved || saved.videoProjectId !== project.id) throw new NotFoundError();
  return saved;
}
