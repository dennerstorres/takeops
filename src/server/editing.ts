import { z } from "zod";
import type {
  EditingInfoWrite,
  EditingRepository,
} from "./editing-repository.ts";
import { NotFoundError, ValidationError } from "./errors.ts";
import { externalUrl } from "./external-url.ts";
import { getProject } from "./project.ts";
import { aspectRatios } from "./project-labels.ts";
import type { ProjectRepository } from "./project-repository.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

const writers = ["OWNER", "ADMIN", "MEMBER"] as const;

export type EditingDeps = {
  workspaces: WorkspaceRepository;
  projects: ProjectRepository;
  editing: EditingRepository;
};

const optionalText = (max: number, message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(max, message),
  );

// Checkbox manda "on" quando marcado e nada quando não.
const checkbox = z.preprocess(
  (value) => value === true || value === "on" || value === "true",
  z.boolean(),
);

const editingSchema = z.object({
  editorId: optionalText(80, "Escolha quem edita."),
  software: optionalText(80, "O software passou de 80 caracteres."),
  projectFileUrl: optionalText(2048, "O link passou de 2048 caracteres."),
  notes: optionalText(4000, "As notas passaram de 4000 caracteres."),
  targetResolution: optionalText(40, "A resolução passou de 40 caracteres."),
  // 23.976 e 29.97 são comuns: o fps aceita até três casas.
  targetFps: z.preprocess(
    (value) =>
      value == null || value === ""
        ? null
        : Number(String(value).replace(",", ".")),
    z
      .number({ error: "Informe o fps em número." })
      .positive("Informe um fps maior que zero.")
      .max(240, "Use no máximo 240 fps.")
      .refine(
        (value) => Math.round(value * 1000) === value * 1000,
        "Use no máximo três casas decimais.",
      )
      .nullable(),
  ),
  aspectRatio: z.preprocess(
    (value) => (typeof value === "string" && value ? value : null),
    z.enum(aspectRatios, { error: "Escolha uma proporção." }).nullable(),
  ),
  captionsRequired: checkbox,
  musicRequired: checkbox,
});

function blank(value: string) {
  return value ? value : null;
}

async function toWrite(
  input: unknown,
  workspaceId: string,
  workspaces: WorkspaceRepository,
): Promise<EditingInfoWrite> {
  const data = parseInput(editingSchema, input);
  const editorId = blank(data.editorId);
  if (editorId) {
    const member = await workspaces.findMembership(editorId, workspaceId);
    if (
      !member ||
      member.workspaceId !== workspaceId ||
      member.userId !== editorId
    ) {
      throw new ValidationError({
        editorId: "Essa pessoa não está neste workspace.",
      });
    }
  }
  const projectFileUrl = blank(data.projectFileUrl);
  return {
    editorId,
    software: blank(data.software),
    projectFileUrl: projectFileUrl
      ? externalUrl(projectFileUrl, "projectFileUrl")
      : null,
    notes: blank(data.notes),
    targetResolution: blank(data.targetResolution),
    targetFps: data.targetFps,
    aspectRatio: data.aspectRatio,
    captionsRequired: data.captionsRequired,
    musicRequired: data.musicRequired,
  };
}

// Produção sem registro de edição ainda devolve null: a tela mostra o
// formulário vazio e o primeiro salvamento cria o registro.
export async function getEditingInfo(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: EditingDeps,
) {
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    deps.workspaces,
    deps.projects,
  );
  const info = await deps.editing.find(project.workspaceId, project.id);
  if (info && info.videoProjectId !== project.id) throw new NotFoundError();
  return info;
}

export async function saveEditingInfo(
  userId: string,
  workspaceId: string,
  projectId: string,
  input: unknown,
  deps: EditingDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    deps.workspaces,
    deps.projects,
  );
  const data = await toWrite(input, project.workspaceId, deps.workspaces);
  const saved = await deps.editing.save(project.workspaceId, project.id, data);
  if (!saved || saved.videoProjectId !== project.id) throw new NotFoundError();
  return saved;
}
