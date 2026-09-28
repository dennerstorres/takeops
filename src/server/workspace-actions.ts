"use server";

import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { runAction, type ActionFailure } from "@/server/service";
import {
  createWorkspace,
  decideFirstAccess,
  listWorkspaces,
} from "@/server/workspace";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type CreateWorkspaceState = Pick<
  ActionFailure,
  "message" | "fields"
> | null;

export async function createFirstWorkspace(
  _state: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const existing = await listWorkspaces(userId, prismaWorkspaceRepository);
  if (decideFirstAccess(userId, existing).kind === "enter") redirect("/");

  const result = await runAction(
    { userId },
    { operation: "create", entity: "Workspace" },
    () =>
      createWorkspace(
        userId,
        { name: formData.get("name") },
        prismaWorkspaceRepository,
      ),
  );

  if (result.ok) redirect("/");
  return { message: result.message, fields: result.fields };
}
