import { redirect } from "next/navigation";
import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";
import { auth } from "@/server/auth";
import { decideFirstAccess, listWorkspaces } from "@/server/workspace";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function FirstAccessPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const memberships = await listWorkspaces(
    session.user.id,
    prismaWorkspaceRepository,
  );
  if (decideFirstAccess(session.user.id, memberships).kind === "enter") {
    redirect("/");
  }

  return <CreateWorkspaceForm email={session.user.email ?? null} />;
}
