"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { createEquipment, updateEquipment } from "@/server/equipment";
import { prismaEquipmentRepository } from "@/server/equipment-prisma";
import { runAction, type ActionFailure } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type EquipmentFormState = Pick<
  ActionFailure,
  "message" | "fields"
> | null;

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

function itemInput(formData: FormData) {
  return {
    name: formData.get("name"),
    category: formData.get("category"),
    notes: formData.get("notes"),
    active: formData.get("active"),
  };
}

export async function createEquipmentAction(
  _state: EquipmentFormState,
  formData: FormData,
): Promise<EquipmentFormState> {
  const current = await currentWorkspace();
  const result = await runAction(
    current,
    { operation: "create", entity: "EquipmentItem" },
    () =>
      createEquipment(
        current.userId,
        current.workspaceId,
        itemInput(formData),
        prismaWorkspaceRepository,
        prismaEquipmentRepository,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath("/configuracoes/equipamentos");
  redirect("/configuracoes/equipamentos");
}

export async function updateEquipmentAction(
  _state: EquipmentFormState,
  formData: FormData,
): Promise<EquipmentFormState> {
  const current = await currentWorkspace();
  const itemId = String(formData.get("itemId") ?? "");
  const result = await runAction(
    current,
    { operation: "update", entity: "EquipmentItem" },
    () =>
      updateEquipment(
        current.userId,
        current.workspaceId,
        itemId,
        itemInput(formData),
        prismaWorkspaceRepository,
        prismaEquipmentRepository,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath("/configuracoes/equipamentos");
  redirect("/configuracoes/equipamentos");
}
