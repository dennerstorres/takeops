"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import {
  addChecklistItem,
  createChecklistTemplate,
  deleteChecklistTemplate,
  getChecklistTemplate,
  removeChecklistItem,
  reorderChecklistItems,
  updateChecklistItem,
  updateChecklistTemplate,
} from "@/server/checklist";
import { prismaChecklistRepository } from "@/server/checklist-prisma";
import { ValidationError } from "@/server/errors";
import { runAction, type ActionFailure } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type ChecklistFormState = Pick<
  ActionFailure,
  "message" | "fields"
> | null;

const ws = prismaWorkspaceRepository;
const repo = prismaChecklistRepository;

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

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function backTo(templateId?: string): never {
  const path = templateId
    ? `/configuracoes/checklists/${templateId}`
    : "/configuracoes/checklists";
  revalidatePath(path);
  redirect(path);
}

export async function createChecklistTemplateAction(
  _state: ChecklistFormState,
  formData: FormData,
): Promise<ChecklistFormState> {
  const current = await currentWorkspace();
  const result = await runAction(
    current,
    { operation: "create", entity: "ChecklistTemplate" },
    () =>
      createChecklistTemplate(
        current.userId,
        current.workspaceId,
        { name: formData.get("name"), type: formData.get("type") },
        ws,
        repo,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  backTo(result.data.id);
}

export async function updateChecklistTemplateAction(
  _state: ChecklistFormState,
  formData: FormData,
): Promise<ChecklistFormState> {
  const current = await currentWorkspace();
  const templateId = field(formData, "templateId");
  const result = await runAction(
    current,
    { operation: "update", entity: "ChecklistTemplate" },
    () =>
      updateChecklistTemplate(
        current.userId,
        current.workspaceId,
        templateId,
        { name: formData.get("name"), type: formData.get("type") },
        ws,
        repo,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  backTo(templateId);
}

export async function deleteChecklistTemplateAction(formData: FormData) {
  const current = await currentWorkspace();
  await runAction(
    current,
    { operation: "delete", entity: "ChecklistTemplate" },
    () =>
      deleteChecklistTemplate(
        current.userId,
        current.workspaceId,
        field(formData, "templateId"),
        ws,
        repo,
      ),
  );
  backTo();
}

export async function addChecklistItemAction(
  _state: ChecklistFormState,
  formData: FormData,
): Promise<ChecklistFormState> {
  const current = await currentWorkspace();
  const templateId = field(formData, "templateId");
  const result = await runAction(
    current,
    { operation: "add-item", entity: "ChecklistTemplate" },
    () =>
      addChecklistItem(
        current.userId,
        current.workspaceId,
        templateId,
        { text: formData.get("text") },
        ws,
        repo,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  backTo(templateId);
}

export async function updateChecklistItemAction(
  _state: ChecklistFormState,
  formData: FormData,
): Promise<ChecklistFormState> {
  const current = await currentWorkspace();
  const templateId = field(formData, "templateId");
  const result = await runAction(
    current,
    { operation: "update-item", entity: "ChecklistTemplate" },
    () =>
      updateChecklistItem(
        current.userId,
        current.workspaceId,
        templateId,
        field(formData, "itemId"),
        { text: formData.get("text") },
        ws,
        repo,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  backTo(templateId);
}

export async function removeChecklistItemAction(formData: FormData) {
  const current = await currentWorkspace();
  const templateId = field(formData, "templateId");
  await runAction(
    current,
    { operation: "remove-item", entity: "ChecklistTemplate" },
    () =>
      removeChecklistItem(
        current.userId,
        current.workspaceId,
        templateId,
        field(formData, "itemId"),
        ws,
        repo,
      ),
  );
  backTo(templateId);
}

export async function moveChecklistItemAction(formData: FormData) {
  const current = await currentWorkspace();
  const templateId = field(formData, "templateId");
  const itemId = field(formData, "itemId");
  const direction = field(formData, "direction");
  await runAction(
    current,
    { operation: "reorder", entity: "ChecklistTemplate" },
    async () => {
      const template = await getChecklistTemplate(
        current.userId,
        current.workspaceId,
        templateId,
        ws,
        repo,
      );
      const ids = template.items.map((item) => item.id);
      const index = ids.indexOf(itemId);
      const target = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || target < 0 || target >= ids.length) {
        throw new ValidationError({ order: "O item já está nessa ponta." });
      }
      const [item] = ids.splice(index, 1);
      ids.splice(target, 0, item);
      return reorderChecklistItems(
        current.userId,
        current.workspaceId,
        templateId,
        { itemIds: ids },
        ws,
        repo,
      );
    },
  );
  backTo(templateId);
}
