"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { prismaEditVersionRepository } from "@/server/edit-version-prisma";
import { prismaProjectRepository } from "@/server/project-prisma";
import {
  createReviewComment,
  setReviewCommentResolved,
  type ReviewDeps,
} from "@/server/review";
import { prismaReviewRepository } from "@/server/review-prisma";
import { runAction, type ActionFailure } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type ReviewCommentFormState = Pick<
  ActionFailure,
  "message" | "fields"
> | null;

const deps: ReviewDeps = {
  workspaces: prismaWorkspaceRepository,
  projects: prismaProjectRepository,
  versions: prismaEditVersionRepository,
  reviews: prismaReviewRepository,
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

function target(formData: FormData) {
  return {
    projectId: String(formData.get("projectId") ?? ""),
    versionId: String(formData.get("versionId") ?? ""),
  };
}

function page(where: { projectId: string; versionId: string }) {
  return `/producoes/${where.projectId}/revisao?versao=${encodeURIComponent(where.versionId)}`;
}

export async function createReviewCommentAction(
  _state: ReviewCommentFormState,
  formData: FormData,
): Promise<ReviewCommentFormState> {
  const current = await currentWorkspace();
  const where = target(formData);
  const result = await runAction(
    current,
    { operation: "create", entity: "ReviewComment" },
    () =>
      createReviewComment(
        current.userId,
        current.workspaceId,
        where,
        { text: formData.get("text"), timestamp: formData.get("timestamp") },
        deps,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath(`/producoes/${where.projectId}/revisao`);
  redirect(page(where));
}

export async function resolveReviewCommentAction(formData: FormData) {
  const current = await currentWorkspace();
  const where = target(formData);
  await runAction(
    current,
    { operation: "resolve", entity: "ReviewComment" },
    () =>
      setReviewCommentResolved(
        current.userId,
        current.workspaceId,
        where,
        String(formData.get("commentId") ?? ""),
        { resolved: formData.get("resolved") },
        deps,
      ),
  );
  revalidatePath(`/producoes/${where.projectId}/revisao`);
  redirect(page(where));
}
