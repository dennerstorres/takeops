"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { zonedLocalToUtc } from "@/lib/zoned-time";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { prismaProjectRepository } from "@/server/project-prisma";
import { runAction, type ActionFailure } from "@/server/service";
import {
  createShoot,
  deleteShoot,
  updateShoot,
  type ShootDeps,
} from "@/server/shoot";
import { prismaShootRepository } from "@/server/shoot-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type ShootFormState = Pick<ActionFailure, "message" | "fields"> | null;

const deps: ShootDeps = {
  workspaces: prismaWorkspaceRepository,
  projects: prismaProjectRepository,
  shoots: prismaShootRepository,
};

async function currentWorkspace() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  return {
    userId: session.user.id,
    workspaceId: access.workspace.workspace.id,
    timezone: access.workspace.workspace.timezone,
  };
}

// O formulário manda o horário de parede do workspace. O service só aceita
// instante com fuso, então a conversão acontece aqui (ADR-028).
function toInstant(value: FormDataEntryValue | null, timezone: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return "";
  return zonedLocalToUtc(text, timezone)?.toISOString() ?? text;
}

function shootInput(formData: FormData, timezone: string) {
  return {
    title: formData.get("title"),
    scheduledAt: toInstant(formData.get("scheduledAt"), timezone),
    endAt: toInstant(formData.get("endAt"), timezone),
    location: formData.get("location"),
    notes: formData.get("notes"),
    status: formData.get("status"),
  };
}

function backToShoots(projectId: string): never {
  revalidatePath(`/producoes/${projectId}/gravacao`);
  redirect(`/producoes/${projectId}/gravacao`);
}

export async function createShootAction(
  _state: ShootFormState,
  formData: FormData,
): Promise<ShootFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const result = await runAction(
    current,
    { operation: "create", entity: "Shoot" },
    () =>
      createShoot(
        current.userId,
        current.workspaceId,
        projectId,
        shootInput(formData, current.timezone),
        deps,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  backToShoots(projectId);
}

export async function updateShootAction(
  _state: ShootFormState,
  formData: FormData,
): Promise<ShootFormState> {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const shootId = String(formData.get("shootId") ?? "");
  const result = await runAction(
    current,
    { operation: "update", entity: "Shoot" },
    () =>
      updateShoot(
        current.userId,
        current.workspaceId,
        projectId,
        shootId,
        shootInput(formData, current.timezone),
        deps,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  backToShoots(projectId);
}

export async function deleteShootAction(formData: FormData) {
  const current = await currentWorkspace();
  const projectId = String(formData.get("projectId") ?? "");
  const shootId = String(formData.get("shootId") ?? "");
  await runAction(current, { operation: "delete", entity: "Shoot" }, () =>
    deleteShoot(current.userId, current.workspaceId, projectId, shootId, deps),
  );
  backToShoots(projectId);
}
