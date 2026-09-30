import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProductionTabs } from "@/components/projects/production-tabs";
import { CastSection } from "@/components/script/cast-section";
import { ScriptForm } from "@/components/script/script-form";
import { buttonVariants } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { listCharacters, listSceneCharacters } from "@/server/character";
import { prismaCharacterRepository } from "@/server/character-prisma";
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

function personLabel(
  member: { name: string | null; email: string | null },
  fallback: string,
) {
  return member.name || member.email || fallback;
}

const scriptLabels = [
  ["hook", "script.hook"],
  ["mainMessage", "script.mainMessage"],
  ["cta", "script.cta"],
  ["notes", "common.notes"],
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
  let cast;
  let sceneCast;
  try {
    project = await getProject(
      session.user.id,
      workspaceId,
      id,
      prismaWorkspaceRepository,
      prismaProjectRepository,
    );
    const characterDeps = {
      workspaces: prismaWorkspaceRepository,
      projects: prismaProjectRepository,
      scenes: prismaSceneRepository,
      characters: prismaCharacterRepository,
    };
    [script, scenes, team, cast, sceneCast] = await Promise.all([
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
      listCharacters(session.user.id, workspaceId, project.id, characterDeps),
      listSceneCharacters(
        session.user.id,
        workspaceId,
        project.id,
        characterDeps,
      ),
    ]);
  } catch (error) {
    if (error instanceof NotFoundError) redirect("/producoes");
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  const people = team.map((member) => ({
    id: member.userId,
    label: personLabel(member, t("common.noName")),
  }));
  const view = buildScriptView(scenes, people);
  const castNames = new Map(cast.map((row) => [row.id, row.name]));
  const castRows = cast.map((row) => ({
    id: row.id,
    name: row.name,
    actorName: row.actorName,
    userId: row.userId,
    sceneCount: [...sceneCast.values()].filter((ids) => ids.includes(row.id))
      .length,
  }));
  const values = {
    hook: script?.hook ?? "",
    mainMessage: script?.mainMessage ?? "",
    cta: script?.cta ?? "",
    notes: script?.notes ?? "",
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <ProductionTabs project={project} active="Roteiro" canEdit={canEdit} />
      <h1 className="sr-only">{t("tabs.script")}</h1>

      <div className="flex flex-wrap justify-end gap-2">
        {canEdit ? (
          <Link
            href={`/producoes/${project.id}/roteiro/importar`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("scriptImport.open")}
          </Link>
        ) : null}
        <a
          href={`/producoes/${project.id}/roteiro/modelo`}
          download
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("script.downloadTemplate")}
        </a>
        <a
          href={`/producoes/${project.id}/roteiro/exportar`}
          download
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("script.exportScript")}
        </a>
      </div>

      {canEdit ? (
        <ScriptForm projectId={project.id} values={values} />
      ) : (
        <dl className="grid gap-3">
          {scriptLabels.map(([key, label]) => (
            <div key={key} className={cn(surfaceClass, "space-y-1 p-3")}>
              <dt className="text-sm text-muted-foreground">{t(label)}</dt>
              <dd className="text-sm whitespace-pre-wrap">
                {values[key] || "—"}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <CastSection
        projectId={project.id}
        cast={castRows}
        people={people}
        canEdit={canEdit}
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-condensed text-sm font-semibold tracking-wider uppercase">
            {t("tabs.scenes")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("script.estimatedTotal", { total: view.total })}
            {view.withoutDuration > 0
              ? t("script.withoutDuration", { count: view.withoutDuration })
              : null}
          </p>
        </div>
        {view.rows.length === 0 ? (
          <EmptyState
            title={t("scenes.emptyTitle")}
            description={t("script.emptyScenes")}
          />
        ) : (
          <ol className="flex flex-col gap-4">
            {view.rows.map((row) => (
              <li key={row.id} className={cn(surfaceClass, "space-y-1 p-3")}>
                <p className="text-sm font-medium">
                  {row.order}. {row.title}
                </p>
                <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{sceneTypeLabel(t, row.type)}</span>
                  <StatusBadge status={row.status}>
                    {sceneStatusLabel(t, row.status)}
                  </StatusBadge>
                  {row.duration ? <span>{row.duration}</span> : null}
                </p>
                {row.dialogue ? (
                  <p className="text-sm whitespace-pre-wrap">
                    {row.speaker ? (
                      <span className="font-medium">{row.speaker}: </span>
                    ) : null}
                    {row.dialogue}
                  </p>
                ) : null}
                {sceneCast.get(row.id)?.length ? (
                  <p className="text-xs text-muted-foreground">
                    {t("cast.inScene", {
                      names: (sceneCast.get(row.id) ?? [])
                        .flatMap((id) => castNames.get(id) ?? [])
                        .join(", "),
                    })}
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
            className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
          >
            {t("script.editScenes")}
          </Link>
        ) : null}
      </section>
    </div>
  );
}
