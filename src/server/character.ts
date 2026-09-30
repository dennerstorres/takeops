import { z } from "zod";
import type {
  CharacterRepository,
  CharacterWrite,
} from "./character-repository.ts";
import { NotFoundError, ValidationError } from "./errors.ts";
import type { ProjectRepository } from "./project-repository.ts";
import { getProject } from "./project.ts";
import type { SceneRepository } from "./scene-repository.ts";
import { getScene } from "./scene.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

const writers = ["OWNER", "ADMIN", "MEMBER"] as const;

export type CharacterDeps = {
  workspaces: WorkspaceRepository;
  projects: ProjectRepository;
  scenes: SceneRepository;
  characters: CharacterRepository;
};

// "Funcionário", "FUNCIONARIO" e "funcionário " são o mesmo personagem.
export function characterKey(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const optionalText = (max: number, message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(max, message),
  );

const characterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do personagem.")
    .max(80, "Use no máximo 80 caracteres."),
  actorName: optionalText(80, "Use no máximo 80 caracteres."),
  userId: optionalText(80, "Escolha uma pessoa do workspace."),
});

async function toWrite(
  input: unknown,
  workspaceId: string,
  workspaces: WorkspaceRepository,
): Promise<CharacterWrite> {
  const data = parseInput(characterSchema, input);
  const userId = data.userId || null;
  if (userId) {
    const member = await workspaces.findMembership(userId, workspaceId);
    if (!member || member.workspaceId !== workspaceId) {
      throw new ValidationError({
        userId: "Essa pessoa não está neste workspace.",
      });
    }
  }
  return { name: data.name, actorName: data.actorName || null, userId };
}

const duplicateName = () =>
  new ValidationError({ name: "Já existe um personagem com esse nome." });

async function writableProject(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: CharacterDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  return getProject(
    userId,
    workspaceId,
    projectId,
    deps.workspaces,
    deps.projects,
  );
}

export async function listCharacters(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: CharacterDeps,
) {
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    deps.workspaces,
    deps.projects,
  );
  const rows = await deps.characters.list(project.workspaceId, project.id);
  return rows.filter((row) => row.videoProjectId === project.id);
}

// Personagens de cada cena, pelo id da cena.
export async function listSceneCharacters(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: CharacterDeps,
) {
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    deps.workspaces,
    deps.projects,
  );
  const links = await deps.characters.listLinks(
    project.workspaceId,
    project.id,
  );
  const byScene = new Map<string, string[]>();
  for (const link of links) {
    byScene.set(link.sceneId, [
      ...(byScene.get(link.sceneId) ?? []),
      link.characterId,
    ]);
  }
  return byScene;
}

export async function createCharacter(
  userId: string,
  workspaceId: string,
  projectId: string,
  input: unknown,
  deps: CharacterDeps,
) {
  const project = await writableProject(userId, workspaceId, projectId, deps);
  const write = await toWrite(input, project.workspaceId, deps.workspaces);
  const existing = await deps.characters.list(project.workspaceId, project.id);
  if (
    existing.some((row) => characterKey(row.name) === characterKey(write.name))
  ) {
    throw duplicateName();
  }
  const created = await deps.characters.create(
    project.workspaceId,
    project.id,
    write,
  );
  if (created === "duplicate") throw duplicateName();
  if (!created || created.videoProjectId !== project.id) {
    throw new NotFoundError();
  }
  return created;
}

export async function updateCharacter(
  userId: string,
  workspaceId: string,
  projectId: string,
  characterId: string,
  input: unknown,
  deps: CharacterDeps,
) {
  const project = await writableProject(userId, workspaceId, projectId, deps);
  const write = await toWrite(input, project.workspaceId, deps.workspaces);
  const existing = await deps.characters.list(project.workspaceId, project.id);
  if (!existing.some((row) => row.id === characterId))
    throw new NotFoundError();
  if (
    existing.some(
      (row) =>
        row.id !== characterId &&
        characterKey(row.name) === characterKey(write.name),
    )
  ) {
    throw duplicateName();
  }
  const updated = await deps.characters.update(
    project.workspaceId,
    project.id,
    characterId,
    write,
  );
  if (updated === "duplicate") throw duplicateName();
  if (!updated) throw new NotFoundError();
  return updated;
}

export async function deleteCharacter(
  userId: string,
  workspaceId: string,
  projectId: string,
  characterId: string,
  deps: CharacterDeps,
) {
  const project = await writableProject(userId, workspaceId, projectId, deps);
  const deleted = await deps.characters.delete(
    project.workspaceId,
    project.id,
    characterId,
  );
  if (!deleted) throw new NotFoundError();
}

export async function setSceneCharacters(
  userId: string,
  workspaceId: string,
  projectId: string,
  sceneId: string,
  characterIds: readonly string[],
  deps: CharacterDeps,
) {
  const project = await writableProject(userId, workspaceId, projectId, deps);
  const scene = await getScene(
    userId,
    workspaceId,
    project.id,
    sceneId,
    deps.workspaces,
    deps.projects,
    deps.scenes,
  );
  const ids = [...new Set(characterIds.filter(Boolean))];
  const saved = await deps.characters.setSceneCharacters(
    project.workspaceId,
    project.id,
    scene.id,
    ids,
  );
  if (!saved) {
    throw new ValidationError({
      characterIds: "Escolha personagens desta produção.",
    });
  }
}
