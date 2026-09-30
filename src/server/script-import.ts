import { recordActivity } from "./activity-record.ts";
import type { ActivityRepository } from "./activity-repository.ts";
import { NotFoundError, ValidationError } from "./errors.ts";
import type { ProjectRepository } from "./project-repository.ts";
import { getProject } from "./project.ts";
import type { SceneRepository, SceneWrite } from "./scene-repository.ts";
import { listScenes, toSceneWrite } from "./scene.ts";
import type {
  ScriptImportRepository,
  ScriptImportWrite,
} from "./script-import-repository.ts";
import {
  parseScriptMarkdown,
  type ParsedScriptFile,
  type ScriptFileWarning,
} from "./script-markdown.ts";
import type { ScriptRepository, ScriptWrite } from "./script-repository.ts";
import { getScript, toScriptWrite } from "./script.ts";
import type { ShotWrite } from "./shot-repository.ts";
import { toShotWrite } from "./shot.ts";
import { requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

const writers = ["OWNER", "ADMIN", "MEMBER"] as const;

// Um roteiro de vídeo curto tem dezenas de cenas; os tetos só barram
// arquivo colado por engano ou abuso.
export const importLimits = {
  characters: 200_000,
  scenes: 200,
  shots: 1000,
} as const;

export type ScriptImportDeps = {
  workspaces: WorkspaceRepository;
  projects: ProjectRepository;
  scenes: SceneRepository;
  scripts: ScriptRepository;
  imports: ScriptImportRepository;
  activities?: ActivityRepository;
};

// Onde o erro está no arquivo: "roteiro", cena N ou plano N.M.
export type ScriptImportProblem = {
  scene: number | null;
  shot: number | null;
  fields: Record<string, string>;
};

export type ScriptImportPreview = {
  scenes: {
    title: string;
    type: SceneWrite["type"];
    estimatedDurationSeconds: number | null;
    shots: { name: string | null; shotType: ShotWrite["shotType"] }[];
  }[];
  shotCount: number;
  existingScenes: number;
  // Soma das cenas já na produção mais as importadas, contra a duração da
  // produção (ou a do arquivo, se a produção não tem).
  totalSeconds: number;
  targetSeconds: number | null;
  scenesWithoutDuration: number;
  filledScriptFields: (keyof ScriptWrite)[];
  sectionTitles: string[];
  warnings: ScriptFileWarning[];
  problems: ScriptImportProblem[];
};

function notesWithSections(parsed: ParsedScriptFile) {
  const parts = [
    parsed.script.notes,
    ...parsed.sections.map((section) =>
      section.title ? `${section.title}\n${section.body}`.trim() : section.body,
    ),
  ].filter((part): part is string => Boolean(part?.trim()));
  return parts.length ? parts.join("\n\n") : null;
}

// Campo do roteiro já preenchido na produção fica como está; notas somam.
function scriptInput(parsed: ParsedScriptFile, current: ScriptWrite | null) {
  const imported = notesWithSections(parsed);
  const notes = [current?.notes, imported].filter(Boolean).join("\n\n");
  const fill = (key: "hook" | "mainMessage" | "cta") =>
    current?.[key] ? undefined : (parsed.script[key] ?? undefined);
  return {
    hook: fill("hook"),
    mainMessage: fill("mainMessage"),
    cta: fill("cta"),
    notes: imported ? notes : undefined,
  };
}

function fieldsOf(error: unknown) {
  if (error instanceof ValidationError) return error.fields;
  throw error;
}

async function plan(
  userId: string,
  workspaceId: string,
  projectId: string,
  text: string,
  deps: ScriptImportDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    deps.workspaces,
    deps.projects,
  );
  const [current, existing] = await Promise.all([
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
  ]);

  if (text.length > importLimits.characters) {
    throw new ValidationError({
      text: `O arquivo passou de ${importLimits.characters} caracteres.`,
    });
  }
  const parsed = parseScriptMarkdown(text);
  if (!parsed.scenes.length) {
    throw new ValidationError({
      text: 'Nenhuma cena encontrada. Cada cena começa com "# Cena N — título".',
    });
  }
  const shotCount = parsed.scenes.reduce(
    (sum, scene) => sum + scene.shots.length,
    0,
  );
  if (
    parsed.scenes.length > importLimits.scenes ||
    shotCount > importLimits.shots
  ) {
    throw new ValidationError({
      text: `Use no máximo ${importLimits.scenes} cenas e ${importLimits.shots} planos por arquivo.`,
    });
  }

  const problems: ScriptImportProblem[] = [];
  const input = scriptInput(parsed, current);
  let script: ScriptWrite | null = null;
  try {
    script = toScriptWrite(input, current);
  } catch (error) {
    problems.push({ scene: null, shot: null, fields: fieldsOf(error) });
  }

  const scenes: ScriptImportWrite["scenes"] = [];
  for (const [sceneIndex, scene] of parsed.scenes.entries()) {
    let sceneWrite: SceneWrite | null = null;
    try {
      // Sem quem fala: pessoa do workspace não viaja no arquivo.
      sceneWrite = await toSceneWrite(
        { ...scene, speakerId: "" },
        project.workspaceId,
        deps.workspaces,
        "PLANNED",
      );
    } catch (error) {
      problems.push({
        scene: sceneIndex + 1,
        shot: null,
        fields: fieldsOf(error),
      });
    }
    const shots: ShotWrite[] = [];
    for (const [shotIndex, shot] of scene.shots.entries()) {
      try {
        shots.push(toShotWrite(shot, "PLANNED"));
      } catch (error) {
        problems.push({
          scene: sceneIndex + 1,
          shot: shotIndex + 1,
          fields: fieldsOf(error),
        });
      }
    }
    if (sceneWrite) scenes.push({ ...sceneWrite, shots });
  }

  const sum = (list: { estimatedDurationSeconds: number | null }[]) =>
    list.reduce((total, row) => total + (row.estimatedDurationSeconds ?? 0), 0);
  const preview: ScriptImportPreview = {
    scenes: parsed.scenes.map((scene) => ({
      title: scene.title,
      type: scene.type,
      estimatedDurationSeconds: scene.estimatedDurationSeconds,
      shots: scene.shots.map((shot) => ({
        name: shot.name,
        shotType: shot.shotType,
      })),
    })),
    shotCount,
    existingScenes: existing.length,
    totalSeconds: sum(existing) + sum(parsed.scenes),
    targetSeconds:
      project.estimatedDurationSeconds ??
      parsed.project.estimatedDurationSeconds,
    scenesWithoutDuration: parsed.scenes.filter(
      (scene) => !scene.estimatedDurationSeconds,
    ).length,
    filledScriptFields: (
      ["hook", "mainMessage", "cta", "notes"] as const
    ).filter((key) => Boolean(input[key])),
    sectionTitles: parsed.sections.map((section) => section.title),
    warnings: parsed.warnings,
    problems,
  };
  return { project, preview, write: script ? { script, scenes } : null };
}

export async function previewScriptImport(
  userId: string,
  workspaceId: string,
  projectId: string,
  text: string,
  deps: ScriptImportDeps,
) {
  return (await plan(userId, workspaceId, projectId, text, deps)).preview;
}

// Recalcula tudo a partir do texto: a prévia que a tela mostrou não é
// confiável como entrada.
export async function importScript(
  userId: string,
  workspaceId: string,
  projectId: string,
  text: string,
  options: { appendToExisting: boolean },
  deps: ScriptImportDeps,
) {
  const { project, preview, write } = await plan(
    userId,
    workspaceId,
    projectId,
    text,
    deps,
  );
  if (!write || preview.problems.length) {
    throw new ValidationError({
      text: "O arquivo tem campos inválidos. Veja a prévia.",
    });
  }
  if (preview.existingScenes > 0 && !options.appendToExisting) {
    throw new ValidationError({
      appendToExisting:
        "A produção já tem cenas. Confirme que as novas entram no fim.",
    });
  }
  const result = await deps.imports.importScript(
    project.workspaceId,
    project.id,
    write,
  );
  if (!result) throw new NotFoundError();
  await recordActivity(deps.activities, {
    workspaceId: project.workspaceId,
    videoProjectId: project.id,
    userId,
    action: "SCRIPT_IMPORTED",
    entityType: "Script",
    entityId: project.id,
    metadata: { scenes: result.sceneIds.length, shots: result.shots },
  });
  return result;
}
