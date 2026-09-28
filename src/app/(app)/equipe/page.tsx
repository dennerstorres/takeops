import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { ForbiddenError } from "@/server/errors";
import { listTeam, roleLabel } from "@/server/team";
import { decideFirstAccess, listWorkspaces } from "@/server/workspace";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

function displayName(name: string | null, email: string | null) {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  if (email) return email;
  return "Sem nome";
}

function initials(label: string) {
  const letters = label
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
  return letters || "?";
}

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const access = decideFirstAccess(
    session.user.id,
    await listWorkspaces(session.user.id, prismaWorkspaceRepository),
  );
  if (access.kind === "setup") redirect("/comecar");

  let members;
  try {
    members = await listTeam(
      session.user.id,
      access.workspace.workspace.id,
      prismaWorkspaceRepository,
    );
  } catch (error) {
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">Equipe</h1>
        <p className="text-sm text-muted-foreground">
          Pessoas com acesso a {access.workspace.workspace.name}.
        </p>
      </header>
      <ul className="flex flex-col gap-3">
        {members.map((member) => {
          const name = displayName(member.name, member.email);
          return (
            <li
              key={member.userId}
              className="flex items-center gap-3 rounded-xl border p-3"
            >
              {member.image ? (
                // URL externa do Google. next/image exigiria allowlist.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.image}
                  alt=""
                  className="size-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium"
                >
                  {initials(name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {member.email ?? "E-mail não informado"}
                </p>
              </div>
              <p className="shrink-0 text-sm">{roleLabel(member.role)}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
