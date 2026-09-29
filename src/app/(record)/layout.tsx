import { redirect } from "next/navigation";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";

// O Modo Gravação fica fora do AppShell: no set a tela inteira é da cena,
// sem menu lateral nem cabeçalho administrativo.
export default async function RecordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");

  return <div className="min-h-dvh bg-background">{children}</div>;
}
