import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { countMyUnread } from "@/server/notification";
import { prismaNotificationRepository } from "@/server/notification-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");

  // O contador é enfeite: se falhar, a página abre sem ele.
  const unread = await countMyUnread(
    session.user.id,
    access.workspace.workspace.id,
    {
      workspaces: prismaWorkspaceRepository,
      notifications: prismaNotificationRepository,
    },
  ).catch(() => 0);

  return (
    <AppShell
      userLabel={session.user.name ?? session.user.email ?? "Conta"}
      workspaceName={access.workspace.workspace.name}
      unread={unread}
    >
      {children}
    </AppShell>
  );
}
