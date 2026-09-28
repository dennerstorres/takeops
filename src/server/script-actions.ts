"use server";

import { redirect } from "next/navigation";
import type { AutosaveActionResult } from "@/lib/autosave";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { prismaProjectRepository } from "@/server/project-prisma";
import { saveScript } from "@/server/script";
import { prismaScriptRepository } from "@/server/script-prisma";
import { runAction } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export async function autosaveScriptAction(
  formData: FormData,
): Promise<AutosaveActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const userId = session.user.id;
  const workspaceId = access.workspace.workspace.id;
  const projectId = String(formData.get("projectId") ?? "");
  const result = await runAction(
    { userId, workspaceId },
    { operation: "autosave", entity: "Script" },
    () =>
      saveScript(
        userId,
        workspaceId,
        projectId,
        {
          hook: formData.get("hook"),
          mainMessage: formData.get("mainMessage"),
          cta: formData.get("cta"),
          notes: formData.get("notes"),
        },
        prismaWorkspaceRepository,
        prismaProjectRepository,
        prismaScriptRepository,
      ),
  );
  if (!result.ok) {
    return { ok: false, message: result.message, fields: result.fields };
  }
  return { ok: true };
}
