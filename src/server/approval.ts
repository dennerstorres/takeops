import { z } from "zod";
import type { ApprovalRepository } from "./approval-repository.ts";
import { getEditVersion, type EditVersionDeps } from "./edit-version.ts";
import { NotFoundError, ValidationError } from "./errors.ts";
import { getProject } from "./project.ts";
import { parseInput } from "./validation.ts";
import { requireRole } from "./workspace.ts";

// Pedir aprovação é de quem produz: dono, admin e membro.
const requesters = ["OWNER", "ADMIN", "MEMBER"] as const;

// A spec dá "aprovar vídeos" a dono e admin.
const deciders = ["OWNER", "ADMIN"] as const;

export type ApprovalDeps = EditVersionDeps & { approvals: ApprovalRepository };

export async function listApprovals(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: ApprovalDeps,
) {
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    deps.workspaces,
    deps.projects,
  );
  const rows = await deps.approvals.list(project.workspaceId, project.id);
  return rows.filter((row) => row.videoProjectId === project.id);
}

// Um pedido aberto por produção: pedir de novo para a mesma versão devolve o
// pedido que já existe; para outra versão, o aberto precisa ser decidido antes.
export async function requestApproval(
  userId: string,
  workspaceId: string,
  projectId: string,
  versionId: string,
  deps: ApprovalDeps,
) {
  await requireRole(userId, workspaceId, requesters, deps.workspaces);
  const version = await getEditVersion(
    userId,
    workspaceId,
    projectId,
    versionId,
    deps,
  );
  const result = await deps.approvals.request(
    workspaceId,
    version.videoProjectId,
    version.id,
    userId,
  );
  if (result.kind === "missing") throw new NotFoundError();
  if (result.kind === "conflict") {
    throw new ValidationError({
      versionId:
        "Já há uma aprovação pendente de outra versão. Decida essa antes.",
    });
  }
  if (result.approval.editVersionId !== version.id) throw new NotFoundError();
  return result.approval;
}

const changesSchema = z.object({
  notes: z
    .string({ error: "Diga o que precisa mudar." })
    .trim()
    .min(1, "Diga o que precisa mudar.")
    .max(4000, "As notas passaram de 4000 caracteres."),
});

// Pedido de alteração devolve a produção para a edição (spec §32).
export async function requestChanges(
  userId: string,
  workspaceId: string,
  projectId: string,
  approvalId: string,
  input: unknown,
  deps: ApprovalDeps,
  now = new Date(),
) {
  await requireRole(userId, workspaceId, deciders, deps.workspaces);
  const { notes } = parseInput(changesSchema, input);
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    deps.workspaces,
    deps.projects,
  );
  const decided = await deps.approvals.decide(
    project.workspaceId,
    project.id,
    approvalId,
    {
      status: "CHANGES_REQUESTED",
      projectStatus: "EDITING",
      reviewedById: userId,
      notes,
      at: now,
    },
  );
  if (!decided || decided.id !== approvalId) throw new NotFoundError();
  return decided;
}
