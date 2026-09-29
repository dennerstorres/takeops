import { z } from "zod";
import { recordActivity } from "./activity-record.ts";
import type { ActivityRepository } from "./activity-repository.ts";
import { NotFoundError, ValidationError } from "./errors.ts";
import { externalUrl } from "./external-url.ts";
import { instant } from "./instant.ts";
import { getProject } from "./project.ts";
import type { ProjectRepository } from "./project-repository.ts";
import { platforms } from "./publication-labels.ts";
import type { PublicationRepository } from "./publication-repository.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

// A spec dá a membro "atualizar publicações"; leitor só vê.
const writers = ["OWNER", "ADMIN", "MEMBER"] as const;

export type PublicationDeps = {
  workspaces: WorkspaceRepository;
  projects: ProjectRepository;
  publications: PublicationRepository;
  activities?: ActivityRepository;
};

export async function publicationScope(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: PublicationDeps,
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

export async function listPublications(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: PublicationDeps,
) {
  const scope = await publicationScope(userId, workspaceId, projectId, deps);
  const rows = await deps.publications.list(scope.workspaceId, scope.projectId);
  return rows.filter((row) => row.videoProjectId === scope.projectId);
}

export async function getPublication(
  userId: string,
  workspaceId: string,
  projectId: string,
  publicationId: string,
  deps: PublicationDeps,
) {
  const scope = await publicationScope(userId, workspaceId, projectId, deps);
  const row = await deps.publications.find(
    scope.workspaceId,
    scope.projectId,
    publicationId,
  );
  if (
    !row ||
    row.id !== publicationId ||
    row.videoProjectId !== scope.projectId
  ) {
    throw new NotFoundError();
  }
  return row;
}

const optionalText = (max: number, message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(max, message),
  );

const destinationSchema = z.object({
  platform: z.enum(platforms, { error: "Escolha a plataforma." }),
  caption: optionalText(5000, "A legenda passou de 5000 caracteres."),
  notes: optionalText(2000, "As notas passaram de 2000 caracteres."),
});

// Destino é onde e com que texto: plataforma, legenda e notas. Horário,
// link e status têm fluxo próprio (PUB-003 e PUB-004).
function toDestination(input: unknown) {
  const data = parseInput(destinationSchema, input);
  return {
    platform: data.platform,
    caption: data.caption ? data.caption : null,
    notes: data.notes ? data.notes : null,
  };
}

export async function createPublication(
  userId: string,
  workspaceId: string,
  projectId: string,
  input: unknown,
  deps: PublicationDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const data = toDestination(input);
  const scope = await publicationScope(userId, workspaceId, projectId, deps);
  const created = await deps.publications.create(
    scope.workspaceId,
    scope.projectId,
    data,
  );
  if (!created || created.videoProjectId !== scope.projectId) {
    throw new NotFoundError();
  }
  return created;
}

export async function updatePublication(
  userId: string,
  workspaceId: string,
  projectId: string,
  publicationId: string,
  input: unknown,
  deps: PublicationDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const data = toDestination(input);
  const scope = await publicationScope(userId, workspaceId, projectId, deps);
  const updated = await deps.publications.update(
    scope.workspaceId,
    scope.projectId,
    publicationId,
    data,
  );
  if (
    !updated ||
    updated.id !== publicationId ||
    updated.videoProjectId !== scope.projectId
  ) {
    throw new NotFoundError();
  }
  return updated;
}

export async function deletePublication(
  userId: string,
  workspaceId: string,
  projectId: string,
  publicationId: string,
  deps: PublicationDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const scope = await publicationScope(userId, workspaceId, projectId, deps);
  const removed = await deps.publications.remove(
    scope.workspaceId,
    scope.projectId,
    publicationId,
  );
  if (!removed) throw new NotFoundError();
}

const scheduleSchema = z.object({
  scheduledAt: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().max(40, "Informe data e hora válidas."),
  ),
});

// Agendar é só registro (spec §33): guarda o instante em UTC e marca
// SCHEDULED. Horário vazio desfaz o agendamento e volta para PENDING.
export async function schedulePublication(
  userId: string,
  workspaceId: string,
  projectId: string,
  publicationId: string,
  input: unknown,
  deps: PublicationDeps,
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const data = parseInput(scheduleSchema, input);
  const scheduledAt = data.scheduledAt
    ? instant(data.scheduledAt, "scheduledAt")
    : null;
  const current = await getPublication(
    userId,
    workspaceId,
    projectId,
    publicationId,
    deps,
  );
  if (current.status === "PUBLISHED") {
    throw new ValidationError({
      scheduledAt: "Esta publicação já saiu; não dá para agendar de novo.",
    });
  }
  const updated = await deps.publications.update(
    workspaceId,
    current.videoProjectId,
    current.id,
    {
      scheduledAt,
      status: scheduledAt ? "SCHEDULED" : "PENDING",
    },
  );
  if (!updated || updated.id !== current.id) throw new NotFoundError();
  if (scheduledAt) {
    await recordActivity(deps.activities, {
      workspaceId,
      videoProjectId: current.videoProjectId,
      userId,
      action: "PUBLICATION_SCHEDULED",
      entityType: "Publication",
      entityId: current.id,
      metadata: {
        platformCode: current.platform,
        scheduledAt: scheduledAt.toISOString(),
      },
    });
  }
  return updated;
}

const outcomeSchema = z.object({
  status: z.enum(["PUBLISHED", "FAILED", "CANCELED"], {
    error: "Escolha o resultado.",
  }),
  publishedAt: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().max(40, "Informe data e hora válidas."),
  ),
  url: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().max(2048, "O link passou de 2048 caracteres."),
  ),
});

// A equipe publica na plataforma e registra aqui o resultado. Publicada
// guarda quando (agora, se não informado) e o link; falha ou cancelamento
// limpam os dois para não parecer que saiu.
export async function recordPublicationOutcome(
  userId: string,
  workspaceId: string,
  projectId: string,
  publicationId: string,
  input: unknown,
  deps: PublicationDeps,
  now = new Date(),
) {
  await requireRole(userId, workspaceId, writers, deps.workspaces);
  const data = parseInput(outcomeSchema, input);
  const published = data.status === "PUBLISHED";
  const publishedAt = published
    ? data.publishedAt
      ? instant(data.publishedAt, "publishedAt")
      : now
    : null;
  const url = published && data.url ? externalUrl(data.url) : null;
  const current = await getPublication(
    userId,
    workspaceId,
    projectId,
    publicationId,
    deps,
  );
  const updated = await deps.publications.update(
    workspaceId,
    current.videoProjectId,
    current.id,
    { status: data.status, publishedAt, url },
  );
  if (!updated || updated.id !== current.id) throw new NotFoundError();
  await recordActivity(deps.activities, {
    workspaceId,
    videoProjectId: current.videoProjectId,
    userId,
    action: "PUBLICATION_RECORDED",
    entityType: "Publication",
    entityId: current.id,
    metadata: {
      platformCode: current.platform,
      status: data.status,
    },
  });
  return updated;
}
