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
import {
  instantiateShootChecklist,
  type ShootChecklistDeps,
} from "@/server/shoot-checklist";
import { prismaShootChecklistRepository } from "@/server/shoot-checklist-prisma";
import {
  addShootEquipment,
  removeShootEquipment,
  updateShootEquipment,
  type ShootEquipmentDeps,
} from "@/server/shoot-equipment";
import { prismaShootEquipmentRepository } from "@/server/shoot-equipment-prisma";
import { prismaShootRepository } from "@/server/shoot-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type ShootFormState = Pick<ActionFailure, "message" | "fields"> | null;

const deps: ShootDeps = {
  workspaces: prismaWorkspaceRepository,
  projects: prismaProjectRepository,
  shoots: prismaShootRepository,
};

const kitDeps: ShootEquipmentDeps = {
  ...deps,
  shootEquipment: prismaShootEquipmentRepository,
};

const checklistDeps: ShootChecklistDeps = {
  ...deps,
  shootChecklist: prismaShootChecklistRepository,
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

function kitIds(formData: FormData) {
  return {
    projectId: String(formData.get("projectId") ?? ""),
    shootId: String(formData.get("shootId") ?? ""),
    rowId: String(formData.get("rowId") ?? ""),
  };
}

export async function addShootEquipmentAction(
  _state: ShootFormState,
  formData: FormData,
): Promise<ShootFormState> {
  const current = await currentWorkspace();
  const { projectId, shootId } = kitIds(formData);
  const result = await runAction(
    current,
    { operation: "add", entity: "ShootEquipment" },
    () =>
      addShootEquipment(
        current.userId,
        current.workspaceId,
        projectId,
        shootId,
        {
          equipmentItemId: formData.get("equipmentItemId"),
          required: formData.get("required"),
          notes: formData.get("notes"),
        },
        kitDeps,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  backToShoots(projectId);
}

// Conferir troca só o checked e mantém obrigatório e notas como estão.
export async function toggleShootEquipmentAction(formData: FormData) {
  const current = await currentWorkspace();
  const { projectId, shootId, rowId } = kitIds(formData);
  await runAction(
    current,
    { operation: "check", entity: "ShootEquipment" },
    () =>
      updateShootEquipment(
        current.userId,
        current.workspaceId,
        projectId,
        shootId,
        rowId,
        {
          required: formData.get("required"),
          checked: formData.get("checked"),
          notes: formData.get("notes"),
        },
        kitDeps,
      ),
  );
  backToShoots(projectId);
}

export async function removeShootEquipmentAction(formData: FormData) {
  const current = await currentWorkspace();
  const { projectId, shootId, rowId } = kitIds(formData);
  await runAction(
    current,
    { operation: "remove", entity: "ShootEquipment" },
    () =>
      removeShootEquipment(
        current.userId,
        current.workspaceId,
        projectId,
        shootId,
        rowId,
        kitDeps,
      ),
  );
  backToShoots(projectId);
}

export async function instantiateShootChecklistAction(
  _state: ShootFormState,
  formData: FormData,
): Promise<ShootFormState> {
  const current = await currentWorkspace();
  const { projectId, shootId } = kitIds(formData);
  const result = await runAction(
    current,
    { operation: "instantiate", entity: "ShootChecklistItem" },
    () =>
      instantiateShootChecklist(
        current.userId,
        current.workspaceId,
        projectId,
        shootId,
        { templateId: formData.get("templateId") },
        checklistDeps,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  backToShoots(projectId);
}
