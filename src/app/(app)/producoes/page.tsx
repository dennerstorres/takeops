import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ForbiddenError } from "@/server/errors";
import { listProjects } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { projectStatusLabel } from "@/server/project-labels";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function ProductionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");

  const workspace = access.workspace.workspace;
  const canEdit = access.workspace.membership.role !== "VIEWER";
  let projects;
  try {
    projects = await listProjects(
      session.user.id,
      workspace.id,
      prismaWorkspaceRepository,
      prismaProjectRepository,
    );
  } catch (error) {
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">Produções</h1>
          <p className="text-sm text-muted-foreground">
            Produções de {workspace.name}.
          </p>
        </div>
        {canEdit ? (
          <Link
            href="/producoes/nova"
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Nova produção
          </Link>
        ) : null}
      </header>
      {projects.length === 0 ? (
        <EmptyState
          title="Nenhuma produção"
          description="As produções da equipe aparecem aqui."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/producoes/${project.id}`}
                className="flex min-h-11 flex-col gap-1 rounded-xl border p-3 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="truncate text-sm font-medium">
                  {project.title}
                </span>
                <span className="text-sm text-muted-foreground">
                  {projectStatusLabel(project.status)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
