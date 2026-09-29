"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { prismaProjectRepository } from "@/server/project-prisma";
import {
  createPublication,
  deletePublication,
  updatePublication,
  type PublicationDeps,
} from "@/server/publication";
import { prismaPublicationRepository } from "@/server/publication-prisma";
import { runAction, type ActionFailure } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type PublicationFormState = Pick<
  ActionFailure,
  "message" | "fields"
> | null;

const deps: PublicationDeps = {
  workspaces: prismaWorkspaceRepository,
  projects: prismaProjectRepository,
  publications: prismaPublicationRepository,
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

function destinationInput(formData: FormData) {
  return {
    platform: formData.get("platform"),
    caption: formData.get("caption"),
    notes: formData.get("notes"),
  };
}

function page(projectId: string) {
  return `/producoes/${projectId}/publicacao`;
}

export async function savePublicationAction(
  _state: PublicationFormState,
  formData: FormData,
): Promise<PublicationFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const publicationId = String(formData.get("publicationId") ?? "");
  const result = await runAction(
    current,
    { operation: publicationId ? "update" : "create", entity: "Publication" },
    () =>
      publicationId
        ? updatePublication(
            current.userId,
            current.workspaceId,
            projectId,
            publicationId,
            destinationInput(formData),
            deps,
          )
        : createPublication(
            current.userId,
            current.workspaceId,
            projectId,
            destinationInput(formData),
            deps,
          ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath(page(projectId));
  redirect(page(projectId));
}

export async function deletePublicationAction(formData: FormData) {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  await runAction(current, { operation: "delete", entity: "Publication" }, () =>
    deletePublication(
      current.userId,
      current.workspaceId,
      projectId,
      String(formData.get("publicationId") ?? ""),
      deps,
    ),
  );
  revalidatePath(page(projectId));
  redirect(page(projectId));
}
