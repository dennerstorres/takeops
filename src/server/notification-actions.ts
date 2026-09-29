"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { markMyNotificationsRead } from "@/server/notification";
import { prismaNotificationRepository } from "@/server/notification-prisma";
import { runAction } from "@/server/service";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

// Um aviso (notificationId) ou todos (sem id). O layout inteiro revalida
// porque o contador do menu muda.
export async function markNotificationsReadAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const current = {
    userId: session.user.id,
    workspaceId: access.workspace.workspace.id,
  };
  const notificationId = String(formData.get("notificationId") ?? "");
  await runAction(
    current,
    { operation: "mark-read", entity: "Notification" },
    () =>
      markMyNotificationsRead(
        current.userId,
        current.workspaceId,
        notificationId || null,
        {
          workspaces: prismaWorkspaceRepository,
          notifications: prismaNotificationRepository,
        },
      ),
  );
  revalidatePath("/", "layout");
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/producoes/") ? next : "/avisos");
}
