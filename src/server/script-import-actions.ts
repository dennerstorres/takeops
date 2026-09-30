"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { prismaActivityRepository } from "@/server/activity-prisma";
import { auth } from "@/server/auth";
import { prismaCharacterRepository } from "@/server/character-prisma";
import { prismaProjectRepository } from "@/server/project-prisma";
import { prismaSceneRepository } from "@/server/scene-prisma";
import {
  importScript,
  previewScriptImport,
  type ScriptImportDeps,
  type ScriptImportPreview,
} from "@/server/script-import";
import { prismaScriptImportRepository } from "@/server/script-import-prisma";
import { prismaScriptRepository } from "@/server/script-prisma";
import { runAction } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export type ScriptImportState = {
  text: string;
  preview: ScriptImportPreview | null;
  message: string | null;
  fields: Record<string, string> | null;
};

const deps: ScriptImportDeps = {
  workspaces: prismaWorkspaceRepository,
  projects: prismaProjectRepository,
  scenes: prismaSceneRepository,
  scripts: prismaScriptRepository,
  imports: prismaScriptImportRepository,
  activities: prismaActivityRepository,
  characters: prismaCharacterRepository,
};

// Um formulário, dois passos: "preview" só lê; "import" recalcula a prévia
// no servidor e grava.
export async function scriptImportAction(
  _state: ScriptImportState,
  formData: FormData,
): Promise<ScriptImportState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const userId = session.user.id;
  const workspaceId = access.workspace.workspace.id;
  const projectId = String(formData.get("projectId") ?? "");
  const text = String(formData.get("text") ?? "");
  const context = { userId, workspaceId };

  if (formData.get("intent") !== "import") {
    const result = await runAction(
      context,
      { operation: "preview", entity: "ScriptImport" },
      () => previewScriptImport(userId, workspaceId, projectId, text, deps),
    );
    return result.ok
      ? { text, preview: result.data, message: null, fields: null }
      : {
          text,
          preview: null,
          message: result.message,
          fields: result.fields ?? null,
        };
  }

  const result = await runAction(
    context,
    { operation: "import", entity: "ScriptImport" },
    () =>
      importScript(
        userId,
        workspaceId,
        projectId,
        text,
        { appendToExisting: formData.get("appendToExisting") === "on" },
        deps,
      ),
  );
  if (!result.ok) {
    const preview = await runAction(
      context,
      { operation: "preview", entity: "ScriptImport" },
      () => previewScriptImport(userId, workspaceId, projectId, text, deps),
    );
    return {
      text,
      preview: preview.ok ? preview.data : null,
      message: result.message,
      fields: result.fields ?? null,
    };
  }
  revalidatePath(`/producoes/${projectId}`, "layout");
  redirect(`/producoes/${projectId}/cenas`);
}
