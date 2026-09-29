import type { ApprovalRepository } from "./approval-repository.ts";
import { getEditVersion, type EditVersionDeps } from "./edit-version.ts";
import { NotFoundError, ValidationError } from "./errors.ts";
import { getProject } from "./project.ts";
import { requireRole } from "./workspace.ts";

// Pedir aprovação é de quem produz: dono, admin e membro.
const requesters = ["OWNER", "ADMIN", "MEMBER"] as const;

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
