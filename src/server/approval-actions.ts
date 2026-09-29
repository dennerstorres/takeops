"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import {
  requestApproval,
  requestChanges,
  type ApprovalDeps,
} from "@/server/approval";
import { prismaApprovalRepository } from "@/server/approval-prisma";
import { auth } from "@/server/auth";
import { prismaEditVersionRepository } from "@/server/edit-version-prisma";
import { prismaProjectRepository } from "@/server/project-prisma";
import { runAction, type ActionFailure } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type ApprovalFormState = Pick<
  ActionFailure,
  "message" | "fields"
> | null;

const deps: ApprovalDeps = {
  workspaces: prismaWorkspaceRepository,
  projects: prismaProjectRepository,
  versions: prismaEditVersionRepository,
  approvals: prismaApprovalRepository,
};

async function currentWorkspace() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  return {
    userId: session.user.id,
    workspaceId: access.workspace.workspace.id,
  };
}

function reviewPage(projectId: string, versionId: string) {
  return `/producoes/${projectId}/revisao?versao=${encodeURIComponent(versionId)}`;
}

export async function requestApprovalAction(
  _state: ApprovalFormState,
  formData: FormData,
): Promise<ApprovalFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const versionId = String(formData.get("versionId") ?? "");
  const result = await runAction(
    current,
    { operation: "request", entity: "Approval" },
    () =>
      requestApproval(
        current.userId,
        current.workspaceId,
        projectId,
        versionId,
        deps,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath(`/producoes/${projectId}/revisao`);
  redirect(reviewPage(projectId, versionId));
}

export async function decideApprovalAction(
  _state: ApprovalFormState,
  formData: FormData,
): Promise<ApprovalFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const versionId = String(formData.get("versionId") ?? "");
  const approvalId = String(formData.get("approvalId") ?? "");
  const result = await runAction(
    current,
    { operation: "request-changes", entity: "Approval" },
    () =>
      requestChanges(
        current.userId,
        current.workspaceId,
        projectId,
        approvalId,
        { notes: formData.get("notes") },
        deps,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath(`/producoes/${projectId}`, "layout");
  redirect(reviewPage(projectId, versionId));
}
