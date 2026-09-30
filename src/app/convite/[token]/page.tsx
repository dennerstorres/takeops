import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { LogoutButton } from "@/components/shell/logout-button";
import { buttonVariants } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { DomainError } from "@/server/errors";
import { acceptInviteToken } from "@/server/invite";
import { prismaInviteRepository } from "@/server/invite-prisma";
import { getWorkspace } from "@/server/workspace";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const session = await auth();
  const { token } = await params;
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/convite/${encodeURIComponent(token)}`);
  }

  let invite;
  try {
    invite = await acceptInviteToken(
      session.user.id,
      token,
      prismaInviteRepository,
    );
  } catch (error) {
    unstable_rethrow(error);
    const message =
      error instanceof DomainError
        ? error.message
        : "Não foi possível aceitar o convite. Tente novamente.";
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8">
        <section className={cn(surfaceClass, "flex flex-col gap-4 p-6")}>
          <h1 className="text-2xl font-medium tracking-tight">Convite</h1>
          <p className="text-sm text-destructive" role="alert">
            {message}
          </p>
          <LogoutButton className="w-full justify-center" />
        </section>
      </main>
    );
  }

  const access = await openWorkspace(session.user.id);
  if (
    access.kind === "enter" &&
    access.workspace.workspace.id === invite.workspaceId
  ) {
    redirect("/");
  }

  const joined = await getWorkspace(
    session.user.id,
    invite.workspaceId,
    prismaWorkspaceRepository,
  );
  const opened =
    access.kind === "enter" ? access.workspace.workspace.name : "o atual";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8">
      <section className={cn(surfaceClass, "flex flex-col gap-4 p-6")}>
        <h1 className="text-2xl font-medium tracking-tight">
          Você entrou em {joined.workspace.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          O workspace aberto continua sendo {opened}.
        </p>
        <Link href="/" className={cn(buttonVariants(), "w-full")}>
          Ir para o início
        </Link>
      </section>
    </main>
  );
}
