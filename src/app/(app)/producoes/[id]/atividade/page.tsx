import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProductionTabs } from "@/components/projects/production-tabs";
import { openWorkspace } from "@/server/access";
import { listProjectActivity } from "@/server/activity";
import { describeActivity } from "@/server/activity-labels";
import { prismaActivityRepository } from "@/server/activity-prisma";
import { auth } from "@/server/auth";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { getProject } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

function personLabel(member: { name: string | null; email: string | null }) {
  return member.name || member.email || "Sem nome";
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const { id } = await params;
  const workspaceId = access.workspace.workspace.id;
  const timezone = access.workspace.workspace.timezone;
  const deps = {
    workspaces: prismaWorkspaceRepository,
    projects: prismaProjectRepository,
    activities: prismaActivityRepository,
  };

  let project;
  let rows;
  let team;
  try {
    project = await getProject(
      session.user.id,
      workspaceId,
      id,
      deps.workspaces,
      deps.projects,
    );
    [rows, team] = await Promise.all([
      listProjectActivity(session.user.id, workspaceId, project.id, deps),
      listTeam(session.user.id, workspaceId, deps.workspaces),
    ]);
  } catch (error) {
    if (error instanceof NotFoundError) redirect("/producoes");
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  const names = new Map(
    team.map((member) => [member.userId, personLabel(member)]),
  );
  const dateTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ProductionTabs projectId={project.id} active="Atividade" />
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">Atividade</h1>
        <p className="text-sm text-muted-foreground">{project.title}</p>
      </header>
      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma atividade"
          description="Criação, mudanças de etapa, versões, aprovações e publicações aparecem aqui."
        />
      ) : (
        <ol className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border p-3">
              <p className="text-sm">
                {describeActivity(
                  row.userId
                    ? (names.get(row.userId) ?? "Ex-membro")
                    : "Alguém",
                  row.action,
                  row.metadata,
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                <time dateTime={row.createdAt.toISOString()}>
                  {dateTime.format(row.createdAt)}
                </time>
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
