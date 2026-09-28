import { redirect } from "next/navigation";
import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";

export default async function FirstAccessPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if ((await openWorkspace(session.user.id)).kind === "enter") redirect("/");

  return <CreateWorkspaceForm email={session.user.email ?? null} />;
}
