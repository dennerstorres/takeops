import { z } from "zod";
import type { ApprovalRepository } from "./approval-repository.ts";
import { getEditVersion, type EditVersionDeps } from "./edit-version.ts";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import type { ParticipantRepository } from "./participant-repository.ts";
import { getProject } from "./project.ts";
import { parseInput } from "./validation.ts";
import { requireMembership, requireRole } from "./workspace.ts";

// Pedir aprovação é de quem produz: dono, admin e membro.
const requesters = ["OWNER", "ADMIN", "MEMBER"] as const;

export type ApprovalDeps = EditVersionDeps & {
  approvals: ApprovalRepository;
  participants: ParticipantRepository;
};

// Dono e admin decidem em qualquer produção (spec §7). Membro decide só
// onde foi colocado como APPROVER. Leitor nunca (ADR-033).
export async function canDecideApproval(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: ApprovalDeps,
) {
  const membership = await requireMembership(
    userId,
    workspaceId,
    deps.workspaces,
  );
  if (membership.role === "OWNER" || membership.role === "ADMIN") return true;
  if (membership.role !== "MEMBER") return false;
  const project = await getProject(
    userId,
    workspaceId,
    projectId,
    deps.workspaces,
    deps.projects,
  );
  const people = await deps.participants.list(project.id);
  return people.some(
    (person) =>
      person.videoProjectId === project.id &&
      person.userId === userId &&
      person.role === "APPROVER",
  );
}

async function requireDecider(
  userId: string,
  workspaceId: string,
  projectId: string,
  deps: ApprovalDeps,
) {
  if (!(await canDecideApproval(userId, workspaceId, projectId, deps))) {
    throw new ForbiddenError("Você não pode aprovar esta produção.");
  }
}

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

const approveSchema = z.object({
  notes: z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(4000, "As notas passaram de 4000 caracteres."),
  ),
});

async function decide(
  userId: string,
  workspaceId: string,
  projectId: string,
  approvalId: string,
  decision: {
    status: "CHANGES_REQUESTED" | "APPROVED";
    projectStatus: "EDITING" | "APPROVED";
    notes: string | null;
  },
  deps: ApprovalDeps,
  now: Date,
) {
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
    { ...decision, reviewedById: userId, at: now },
  );
  if (!decided || decided.id !== approvalId) throw new NotFoundError();
  return decided;
}

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
  await requireDecider(userId, workspaceId, projectId, deps);
  const { notes } = parseInput(changesSchema, input);
  return decide(
    userId,
    workspaceId,
    projectId,
    approvalId,
    { status: "CHANGES_REQUESTED", projectStatus: "EDITING", notes },
    deps,
    now,
  );
}

// Aprovar a versão aprova a produção (spec §32). Nota é opcional.
export async function approveVersion(
  userId: string,
  workspaceId: string,
  projectId: string,
  approvalId: string,
  input: unknown,
  deps: ApprovalDeps,
  now = new Date(),
) {
  await requireDecider(userId, workspaceId, projectId, deps);
  const { notes } = parseInput(approveSchema, input);
  return decide(
    userId,
    workspaceId,
    projectId,
    approvalId,
    { status: "APPROVED", projectStatus: "APPROVED", notes: notes || null },
    deps,
    now,
  );
}
