import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { auth } from "@/server/auth";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <AppShell userLabel={session.user.name ?? session.user.email ?? "Conta"}>
      {children}
    </AppShell>
  );
}
