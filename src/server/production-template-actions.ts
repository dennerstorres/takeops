"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import {
  addTemplateScene,
  createProductionTemplate,
  deleteProductionTemplate,
  moveTemplateScene,
  removeTemplateScene,
  updateProductionTemplate,
  type ProductionTemplateDeps,
} from "@/server/production-template";
import { prismaProductionTemplateRepository } from "@/server/production-template-prisma";
import { runAction, type ActionFailure } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type ProductionTemplateFormState = Pick<
  ActionFailure,
  "message" | "fields"
> | null;

const deps: ProductionTemplateDeps = {
  workspaces: prismaWorkspaceRepository,
  templates: prismaProductionTemplateRepository,
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

function templateInput(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
  };
}

export async function saveProductionTemplateAction(
  _state: ProductionTemplateFormState,
  formData: FormData,
): Promise<ProductionTemplateFormState> {
  const current = await currentWorkspace();
  const templateId = String(formData.get("templateId") ?? "");
  const result = await runAction(
    current,
    {
      operation: templateId ? "update" : "create",
      entity: "ProductionTemplate",
    },
    () =>
      templateId
        ? updateProductionTemplate(
            current.userId,
            current.workspaceId,
            templateId,
            templateInput(formData),
            deps,
          )
        : createProductionTemplate(
            current.userId,
            current.workspaceId,
            templateInput(formData),
            deps,
          ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath("/templates");
  redirect(`/templates/${result.data.id}`);
}

export async function deleteProductionTemplateAction(formData: FormData) {
  const current = await currentWorkspace();
  await runAction(
    current,
    { operation: "delete", entity: "ProductionTemplate" },
    () =>
      deleteProductionTemplate(
        current.userId,
        current.workspaceId,
        String(formData.get("templateId") ?? ""),
        deps,
      ),
  );
  revalidatePath("/templates");
  redirect("/templates");
}

function templatePage(templateId: string) {
  return `/templates/${encodeURIComponent(templateId)}`;
}

export async function addTemplateSceneAction(
  _state: ProductionTemplateFormState,
  formData: FormData,
): Promise<ProductionTemplateFormState> {
  const current = await currentWorkspace();
  const templateId = String(formData.get("templateId") ?? "");
  const result = await runAction(
    current,
    { operation: "add-scene", entity: "ProductionTemplate" },
    () =>
      addTemplateScene(
        current.userId,
        current.workspaceId,
        templateId,
        {
          title: formData.get("title"),
          type: formData.get("type"),
          description: formData.get("description"),
        },
        deps,
      ),
  );
  if (!result.ok) return { message: result.message, fields: result.fields };
  revalidatePath(templatePage(templateId));
  redirect(`${templatePage(templateId)}#cenas`);
}

// Subir, descer e remover são botões do mesmo formulário por cena.
export async function changeTemplateSceneAction(formData: FormData) {
  const current = await currentWorkspace();
  const templateId = String(formData.get("templateId") ?? "");
  const sceneId = String(formData.get("sceneId") ?? "");
  const intent = String(formData.get("intent") ?? "");
  await runAction(
    current,
    { operation: `scene-${intent}`, entity: "ProductionTemplate" },
    () =>
      intent === "remove"
        ? removeTemplateScene(
            current.userId,
            current.workspaceId,
            templateId,
            sceneId,
            deps,
          )
        : moveTemplateScene(
            current.userId,
            current.workspaceId,
            templateId,
            sceneId,
            { direction: intent },
            deps,
          ),
  );
  revalidatePath(templatePage(templateId));
  redirect(`${templatePage(templateId)}#cenas`);
}
