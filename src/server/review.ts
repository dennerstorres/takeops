import { z } from "zod";
import { parseTimestamp } from "../lib/timestamp.ts";
import {
  getEditVersion,
  versionLabel,
  type EditVersionDeps,
} from "./edit-version.ts";
import { NotFoundError } from "./errors.ts";
import { notify } from "./notification.ts";
import { projectAudience } from "./notification-audience.ts";
import { getProject } from "./project.ts";
import type { ReviewRepository, ReviewScope } from "./review-repository.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";

// Leitor não comenta: a spec condiciona a uma configuração do workspace que
// ainda não existe (ADR-032).
const reviewers = ["OWNER", "ADMIN", "MEMBER"] as const;

// Um dia inteiro cobre qualquer vídeo que passe por revisão aqui.
export const MAX_TIMESTAMP_SECONDS = 24 * 60 * 60 - 1;

export type ReviewDeps = EditVersionDeps & { reviews: ReviewRepository };

export type ReviewTarget = { projectId: string; versionId: string };

const commentSchema = z.object({
  text: z
    .string({ error: "Escreva o comentário." })
    .trim()
    .min(1, "Escreva o comentário.")
    .max(2000, "O comentário passou de 2000 caracteres."),
  // A tela manda o texto digitado ("01:04"); chamada interna pode mandar
  // segundos já contados.
  timestamp: z.preprocess(
    (value) =>
      typeof value === "string"
        ? parseTimestamp(value)
        : value == null
          ? null
          : value,
    z
      .number({ error: "Use o tempo como 01:04 ou 1:02:03." })
      .refine((value) => !Number.isNaN(value), {
        message: "Use o tempo como 01:04 ou 1:02:03.",
      })
      .int("Use o tempo em segundos inteiros.")
      .min(0, "O tempo não pode ser negativo.")
      .max(MAX_TIMESTAMP_SECONDS, "O tempo passou de 23:59:59.")
      .nullable(),
  ),
});

// A versão passa pela checagem de workspace e produção antes de qualquer
// leitura de comentário.
export async function reviewScope(
  userId: string,
  workspaceId: string,
  target: ReviewTarget,
  deps: ReviewDeps,
): Promise<ReviewScope> {
  const version = await getEditVersion(
    userId,
    workspaceId,
    target.projectId,
    target.versionId,
    deps,
  );
  return {
    workspaceId,
    projectId: version.videoProjectId,
    versionId: version.id,
  };
}

export async function listReviewComments(
  userId: string,
  workspaceId: string,
  target: ReviewTarget,
  deps: ReviewDeps,
) {
  const scope = await reviewScope(userId, workspaceId, target, deps);
  const rows = await deps.reviews.list(scope);
  return rows.filter((row) => row.editVersionId === scope.versionId);
}

export async function createReviewComment(
  userId: string,
  workspaceId: string,
  target: ReviewTarget,
  input: unknown,
  deps: ReviewDeps,
) {
  await requireRole(userId, workspaceId, reviewers, deps.workspaces);
  const data = parseInput(commentSchema, input);
  const scope = await reviewScope(userId, workspaceId, target, deps);
  const created = await deps.reviews.create(scope, {
    authorId: userId,
    timestampSeconds: data.timestamp,
    text: data.text,
  });
  if (!created || created.editVersionId !== scope.versionId) {
    throw new NotFoundError();
  }
  if (deps.notifications) {
    const [project, version] = await Promise.all([
      getProject(
        userId,
        workspaceId,
        scope.projectId,
        deps.workspaces,
        deps.projects,
      ),
      deps.versions.find(workspaceId, scope.projectId, scope.versionId),
    ]);
    await notify(
      deps.notifications,
      {
        workspaceId,
        actorId: userId,
        videoProjectId: scope.projectId,
        type: "REVIEW_COMMENT_CREATED",
        metadata: version
          ? { version: versionLabel(version.versionNumber) }
          : null,
      },
      await projectAudience(project, deps.participants, [version?.createdById]),
    );
  }
  return created;
}

const resolveSchema = z.object({
  // Checkbox e botão mandam texto; chamada interna pode mandar booleano.
  resolved: z.preprocess(
    (value) =>
      value === true || value === "true" || value === "on"
        ? true
        : value === false || value === "false"
          ? false
          : value,
    z.boolean({ error: "Diga se o comentário está resolvido." }),
  ),
});

export async function setReviewCommentResolved(
  userId: string,
  workspaceId: string,
  target: ReviewTarget,
  commentId: string,
  input: unknown,
  deps: ReviewDeps,
  now = new Date(),
) {
  await requireRole(userId, workspaceId, reviewers, deps.workspaces);
  const { resolved } = parseInput(resolveSchema, input);
  const scope = await reviewScope(userId, workspaceId, target, deps);
  const updated = await deps.reviews.setResolved(scope, commentId, {
    resolved,
    userId,
    at: now,
  });
  if (
    !updated ||
    updated.id !== commentId ||
    updated.editVersionId !== scope.versionId
  ) {
    throw new NotFoundError();
  }
  return updated;
}
