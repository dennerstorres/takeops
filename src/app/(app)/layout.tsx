import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { auth } from "@/server/auth";
import { decideFirstAccess, listWorkspaces } from "@/server/workspace";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const memberships = await listWorkspaces(
    session.user.id,
    prismaWorkspaceRepository,
  );
  const access = decideFirstAccess(session.user.id, memberships);
  if (access.kind === "setup") redirect("/comecar");

  return (
    <AppShell
      userLabel={session.user.name ?? session.user.email ?? "Conta"}
      workspaceName={access.workspace.workspace.name}
    >
      {children}
    </AppShell>
  );
}
