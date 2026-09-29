import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProductionTabs } from "@/components/projects/production-tabs";
import { ScriptForm } from "@/components/script/script-form";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { getProject } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { listScenes } from "@/server/scene";
import { sceneStatusLabel, sceneTypeLabel } from "@/server/scene-labels";
import { prismaSceneRepository } from "@/server/scene-prisma";
import { getScript } from "@/server/script";
import { prismaScriptRepository } from "@/server/script-prisma";
import { buildScriptView } from "@/server/script-view";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

function personLabel(member: { name: string | null; email: string | null }) {
  return member.name || member.email || "Sem nome";
}

const scriptLabels = [
  ["hook", "Gancho"],
  ["mainMessage", "Mensagem principal"],
  ["cta", "Chamada para ação"],
  ["notes", "Notas"],
] as const;

export default async function ScriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const { id } = await params;
  const workspaceId = access.workspace.workspace.id;
  const canEdit = access.workspace.membership.role !== "VIEWER";

  let project;
  let script;
  let scenes;
  let team;
  try {
    project = await getProject(
      session.user.id,
      workspaceId,
      id,
      prismaWorkspaceRepository,
      prismaProjectRepository,
    );
    [script, scenes, team] = await Promise.all([
      getScript(
        session.user.id,
        workspaceId,
        project.id,
        prismaWorkspaceRepository,
        prismaProjectRepository,
        prismaScriptRepository,
      ),
      listScenes(
        session.user.id,
        workspaceId,
        project.id,
        prismaWorkspaceRepository,
        prismaProjectRepository,
        prismaSceneRepository,
      ),
      listTeam(session.user.id, workspaceId, prismaWorkspaceRepository),
    ]);
  } catch (error) {
    if (error instanceof NotFoundError) redirect("/producoes");
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  const view = buildScriptView(
    scenes,
    team.map((member) => ({ id: member.userId, label: personLabel(member) })),
  );
  const values = {
    hook: script?.hook ?? "",
    mainMessage: script?.mainMessage ?? "",
    cta: script?.cta ?? "",
    notes: script?.notes ?? "",
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ProductionTabs projectId={project.id} active="Roteiro" />
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">Roteiro</h1>
        <p className="text-sm text-muted-foreground">{project.title}</p>
      </header>

      {canEdit ? (
        <ScriptForm projectId={project.id} values={values} />
      ) : (
        <dl className="grid gap-3">
          {scriptLabels.map(([key, label]) => (
            <div key={key} className="space-y-1">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-sm whitespace-pre-wrap">
                {values[key] || "—"}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-medium">Cenas</h2>
          <p className="text-sm text-muted-foreground">
            Total estimado {view.total}
            {view.withoutDuration > 0
              ? ` · ${view.withoutDuration} sem duração`
              : null}
          </p>
        </div>
        {view.rows.length === 0 ? (
          <EmptyState
            title="Nenhuma cena"
            description="O roteiro é montado pelas cenas desta produção."
          />
        ) : (
          <ol className="flex flex-col gap-4">
            {view.rows.map((row) => (
              <li key={row.id} className="space-y-1 border-l-2 pl-3">
                <p className="text-sm font-medium">
                  {row.order}. {row.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sceneTypeLabel(t, row.type)} ·{" "}
                  {sceneStatusLabel(t, row.status)}
                  {row.duration ? ` · ${row.duration}` : null}
                </p>
                {row.dialogue ? (
                  <p className="text-sm whitespace-pre-wrap">
                    {row.speaker ? (
                      <span className="font-medium">{row.speaker}: </span>
                    ) : null}
                    {row.dialogue}
                  </p>
                ) : null}
                {row.action ? (
                  <p className="text-sm text-muted-foreground italic">
                    {row.action}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
        {canEdit ? (
          <Link
            href={`/producoes/${project.id}/cenas`}
            className="inline-flex min-h-11 w-fit items-center rounded-lg border px-3 text-sm"
          >
            Editar cenas
          </Link>
        ) : null}
      </section>
    </div>
  );
}
