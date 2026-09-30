import { listCharacters, listSceneCharacters } from "./character.ts";
import type { CharacterRepository } from "./character-repository.ts";
import type { ProjectRecord } from "./project-repository.ts";
import { getProject } from "./project.ts";
import type { SceneRecord } from "./scene-repository.ts";
import { listScenes } from "./scene.ts";
import type { ScriptFile } from "./script-markdown.ts";
import type { ScriptRepository } from "./script-repository.ts";
import { getScript } from "./script.ts";
import type { ShotRecord } from "./shot-repository.ts";
import { listShotsByScene, type ShotDeps } from "./shot.ts";

type ScriptText = {
  hook: string | null;
  mainMessage: string | null;
  cta: string | null;
  notes: string | null;
};

export function toScriptFile(
  project: ProjectRecord,
  script: ScriptText | null,
  scenes: readonly SceneRecord[],
  shotsByScene: ReadonlyMap<string, readonly ShotRecord[]>,
  charactersByScene: ReadonlyMap<string, readonly string[]> = new Map(),
): ScriptFile {
  return {
    project: {
      title: project.title,
      format: project.format,
      aspectRatio: project.aspectRatio,
      estimatedDurationSeconds: project.estimatedDurationSeconds,
      objective: project.objective,
      audience: project.audience,
      product: project.product,
      description: project.description,
    },
    script: {
      hook: script?.hook ?? null,
      mainMessage: script?.mainMessage ?? null,
      cta: script?.cta ?? null,
      notes: script?.notes ?? null,
    },
    // Quem fala é um usuário do workspace e não viaja no arquivo; os
    // personagens, sim, pelo nome.
    scenes: [...scenes]
      .sort((left, right) => left.order - right.order)
      .map((scene) => ({
        title: scene.title,
        type: scene.type,
        description: scene.description,
        dialogue: scene.dialogue,
        action: scene.action,
        estimatedDurationSeconds: scene.estimatedDurationSeconds,
        cameraInstructions: scene.cameraInstructions,
        editingInstructions: scene.editingInstructions,
        continuityNotes: scene.continuityNotes,
        characters: [...(charactersByScene.get(scene.id) ?? [])],
        shots: (shotsByScene.get(scene.id) ?? []).map((shot) => ({
          name: shot.name,
          cameraLabel: shot.cameraLabel,
          shotType: shot.shotType,
          framing: shot.framing,
          angle: shot.angle,
          subject: shot.subject,
          movement: shot.movement,
          description: shot.description,
          requiredTakes: shot.requiredTakes,
          notes: shot.notes,
        })),
      })),
  };
}

export async function exportScriptFile(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: ShotDeps & {
    scripts: ScriptRepository;
    characters: CharacterRepository;
  },
) {
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    deps.workspaces,
    deps.projects,
  );
  const [script, scenes, shots, cast, links] = await Promise.all([
    getScript(
      userId,
      workspaceId,
      project.id,
      deps.workspaces,
      deps.projects,
      deps.scripts,
    ),
    listScenes(
      userId,
      workspaceId,
      project.id,
      deps.workspaces,
      deps.projects,
      deps.scenes,
    ),
    listShotsByScene(userId, workspaceId, project.id, deps),
    listCharacters(userId, workspaceId, project.id, deps),
    listSceneCharacters(userId, workspaceId, project.id, deps),
  ]);
  const names = new Map(cast.map((row) => [row.id, row.name]));
  const charactersByScene = new Map(
    [...links].map(([sceneId, ids]) => [
      sceneId,
      ids.flatMap((id) => names.get(id) ?? []).sort(),
    ]),
  );
  return {
    project,
    file: toScriptFile(project, script, scenes, shots, charactersByScene),
  };
}

// Nome do arquivo baixado: só letras simples, para qualquer sistema abrir.
export function scriptFileName(project: Pick<ProjectRecord, "slug" | "title">) {
  const base = (project.slug || project.title)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "roteiro"}.md`;
}
