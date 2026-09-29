import { z } from "zod";
import { NotFoundError, ValidationError } from "./errors.ts";
import { getProject } from "./project.ts";
import type { ProjectRepository } from "./project-repository.ts";
import { sceneStatuses, sceneTypes, type SceneStatus } from "./scene-labels.ts";
import type { SceneRepository, SceneWrite } from "./scene-repository.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

const writers = ["OWNER", "ADMIN", "MEMBER"] as const;

const optionalText = (max: number, message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(max, message),
  );

const sceneSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Informe o título.")
    .max(120, "Use no máximo 120 caracteres."),
  description: optionalText(4000, "A descrição passou de 4000 caracteres."),
  type: z.enum(sceneTypes, { error: "Escolha um tipo." }),
  speakerId: optionalText(80, "Escolha quem fala."),
  dialogue: optionalText(4000, "A fala passou de 4000 caracteres."),
  action: optionalText(2000, "A ação passou de 2000 caracteres."),
  estimatedDurationSeconds: z.preprocess(
    (value) => (value == null || value === "" ? undefined : Number(value)),
    z
      .number()
      .int()
      .min(1, "A duração precisa ser de pelo menos 1 segundo.")
      .max(86400, "A duração passou de 24 horas.")
      .optional(),
  ),
  cameraInstructions: optionalText(2000, "A câmera passou de 2000 caracteres."),
  editingInstructions: optionalText(
    2000,
    "A edição passou de 2000 caracteres.",
  ),
  continuityNotes: optionalText(
    2000,
    "A continuidade passou de 2000 caracteres.",
  ),
});

function blank(value: string) {
  return value ? value : null;
}

async function toWrite(
  input: unknown,
  workspaceId: string,
  workspaces: WorkspaceRepository,
  status: SceneStatus,
): Promise<SceneWrite> {
  const data = parseInput(sceneSchema, input);
  const speakerId = blank(data.speakerId);
  if (speakerId) {
    const member = await workspaces.findMembership(speakerId, workspaceId);
    if (
      !member ||
      member.workspaceId !== workspaceId ||
      member.userId !== speakerId
    ) {
      throw new ValidationError({
        speakerId: "Essa pessoa não está neste workspace.",
      });
    }
  }
  return {
    title: data.title,
    description: blank(data.description),
    type: data.type,
    speakerId,
    dialogue: blank(data.dialogue),
    action: blank(data.action),
    estimatedDurationSeconds: data.estimatedDurationSeconds ?? null,
    cameraInstructions: blank(data.cameraInstructions),
    editingInstructions: blank(data.editingInstructions),
    continuityNotes: blank(data.continuityNotes),
    status,
  };
}

const statusSchema = z.object({
  status: z.preprocess(
    (value) => (typeof value === "string" && value ? value : undefined),
    z.enum(sceneStatuses, { error: "Escolha um status." }).optional(),
  ),
});

export async function listScenes(
  userId: string,
  workspaceId: string,
  projectId: string,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
  scenes: SceneRepository,
) {
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    workspaces,
    projects,
  );
  const rows = await scenes.list(project.workspaceId, project.id);
  return rows.filter((scene) => scene.videoProjectId === project.id);
}

export async function getScene(
  userId: string,
  workspaceId: string,
  projectId: string,
  sceneId: string,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
  scenes: SceneRepository,
) {
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    workspaces,
    projects,
  );
  const scene = await scenes.find(project.workspaceId, project.id, sceneId);
  if (!scene || scene.videoProjectId !== project.id || scene.id !== sceneId) {
    throw new NotFoundError();
  }
  return scene;
}

export async function createScene(
  userId: string,
  workspaceId: string,
  projectId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
  scenes: SceneRepository,
) {
  await requireRole(userId, workspaceId, writers, workspaces);
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    workspaces,
    projects,
  );
  const created = await scenes.create(
    project.workspaceId,
    project.id,
    await toWrite(input, project.workspaceId, workspaces, "PLANNED"),
  );
  if (
    !created ||
    created.videoProjectId !== project.id ||
    created.status !== "PLANNED"
  ) {
    throw new NotFoundError();
  }
  return created;
}

export async function duplicateScene(
  userId: string,
  workspaceId: string,
  projectId: string,
  sceneId: string,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
  scenes: SceneRepository,
) {
  await requireRole(userId, workspaceId, writers, workspaces);
  const current = await getScene(
    userId,
    workspaceId,
    projectId,
    sceneId,
    workspaces,
    projects,
    scenes,
  );
  const created = await scenes.create(
    workspaceId,
    projectId,
    await toWrite(
      {
        title: current.title,
        description: current.description ?? "",
        type: current.type,
        speakerId: current.speakerId ?? "",
        dialogue: current.dialogue ?? "",
        action: current.action ?? "",
        estimatedDurationSeconds: current.estimatedDurationSeconds ?? "",
        cameraInstructions: current.cameraInstructions ?? "",
        editingInstructions: current.editingInstructions ?? "",
        continuityNotes: current.continuityNotes ?? "",
      },
      workspaceId,
      workspaces,
      "PLANNED",
    ),
  );
  if (
    !created ||
    created.id === current.id ||
    created.videoProjectId !== current.videoProjectId ||
    created.status !== "PLANNED" ||
    created.order <= current.order
  ) {
    throw new NotFoundError();
  }
  return created;
}

export async function updateScene(
  userId: string,
  workspaceId: string,
  projectId: string,
  sceneId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
  scenes: SceneRepository,
) {
  await requireRole(userId, workspaceId, writers, workspaces);
  const current = await getScene(
    userId,
    workspaceId,
    projectId,
    sceneId,
    workspaces,
    projects,
    scenes,
  );
  const status = parseInput(statusSchema, input).status ?? current.status;
  const updated = await scenes.update(
    workspaceId,
    projectId,
    current.id,
    await toWrite(input, workspaceId, workspaces, status),
  );
  if (
    !updated ||
    updated.id !== current.id ||
    updated.videoProjectId !== current.videoProjectId ||
    updated.order !== current.order
  ) {
    throw new NotFoundError();
  }
  return updated;
}

// No set só se marca o resultado da gravação. Os outros status continuam na
// edição da cena.
export const recordingSceneStatuses = ["RECORDED", "NEEDS_RETAKE"] as const;

const recordingSchema = z.object({
  status: z.enum(recordingSceneStatuses, { error: "Escolha um status." }),
});

export async function setSceneRecordingStatus(
  userId: string,
  workspaceId: string,
  projectId: string,
  sceneId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
  scenes: SceneRepository,
) {
  await requireRole(userId, workspaceId, writers, workspaces);
  const { status } = parseInput(recordingSchema, input);
  const current = await getScene(
    userId,
    workspaceId,
    projectId,
    sceneId,
    workspaces,
    projects,
    scenes,
  );
  const updated = await scenes.update(workspaceId, projectId, current.id, {
    status,
  });
  if (
    !updated ||
    updated.id !== current.id ||
    updated.videoProjectId !== current.videoProjectId
  ) {
    throw new NotFoundError();
  }
  return updated;
}

export async function deleteScene(
  userId: string,
  workspaceId: string,
  projectId: string,
  sceneId: string,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
  scenes: SceneRepository,
  deletedAt = new Date(),
) {
  await requireRole(userId, workspaceId, writers, workspaces);
  const current = await getScene(
    userId,
    workspaceId,
    projectId,
    sceneId,
    workspaces,
    projects,
    scenes,
  );
  const removed = await scenes.softDelete(
    workspaceId,
    projectId,
    current.id,
    deletedAt,
  );
  if (!removed) throw new NotFoundError();
}

const orderSchema = z.object({
  sceneIds: z.array(z.string().trim().min(1)).max(500),
});

export async function reorderScenes(
  userId: string,
  workspaceId: string,
  projectId: string,
  input: unknown,
  workspaces: WorkspaceRepository,
  projects: ProjectRepository,
  scenes: SceneRepository,
) {
  await requireRole(userId, workspaceId, writers, workspaces);
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    workspaces,
    projects,
  );
  const ids = parseInput(orderSchema, input).sceneIds;
  const rows = await scenes.reorder(project.workspaceId, project.id, ids);
  if (!rows) {
    throw new ValidationError({
      order: "A lista de cenas mudou. Atualize a página.",
    });
  }
  if (
    rows.length !== ids.length ||
    rows.some(
      (row, index) =>
        row.id !== ids[index] ||
        row.order !== index + 1 ||
        row.videoProjectId !== project.id,
    )
  ) {
    throw new NotFoundError();
  }
  return rows;
}
