import { getTranslations } from "next-intl/server";
import { ArrowDown, ArrowUp, Copy } from "lucide-react";
import { Fragment } from "react";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProductionTabs } from "@/components/projects/production-tabs";
import { DeleteSceneButton } from "@/components/scenes/delete-scene-button";
import { SceneForm } from "@/components/scenes/scene-form";
import { surfaceClass } from "@/components/ui/card";
import { Strip, StripBoard, stripIconButton } from "@/components/ui/strip";
import { scenePhase, sceneTip } from "@/components/ui/strip-phase";
import { cn } from "@/lib/utils";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { getProject } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { duplicateSceneAction, moveSceneAction } from "@/server/scene-actions";
import { listScenes } from "@/server/scene";
import { sceneStatusLabel, sceneTypeLabel } from "@/server/scene-labels";
import { prismaSceneRepository } from "@/server/scene-prisma";
import { listShotsByScene } from "@/server/shot";
import { shotDisplayName, shotSummary } from "@/server/shot-labels";
import { prismaShotRepository } from "@/server/shot-prisma";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

function personLabel(
  member: { name: string | null; email: string | null },
  fallback: string,
) {
  return member.name || member.email || fallback;
}

export default async function ScenesPage({
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
  let scenes;
  let team;
  let shotsByScene;
  try {
    project = await getProject(
      session.user.id,
      workspaceId,
      id,
      prismaWorkspaceRepository,
      prismaProjectRepository,
    );
    [scenes, team, shotsByScene] = await Promise.all([
      listScenes(
        session.user.id,
        workspaceId,
        project.id,
        prismaWorkspaceRepository,
        prismaProjectRepository,
        prismaSceneRepository,
      ),
      listTeam(session.user.id, workspaceId, prismaWorkspaceRepository),
      listShotsByScene(session.user.id, workspaceId, project.id, {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        scenes: prismaSceneRepository,
        shots: prismaShotRepository,
      }),
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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <ProductionTabs project={project} active="Cenas" canEdit={canEdit} />
      <h1 className="sr-only">{t("tabs.scenes")}</h1>
      {scenes.length === 0 ? (
        <EmptyState
          title={t("scenes.emptyTitle")}
          description={t("scenes.emptyDescription")}
        />
      ) : (
        <StripBoard
          label={t("tabs.scenes")}
          columns={{
            number: t("scenes.board.number"),
            title: t("common.title"),
            owner: t("common.type"),
            date: t("common.status"),
            meta: t("scenes.board.shots"),
            action: canEdit ? "" : undefined,
          }}
        >
          {scenes.map((scene, index) => {
            const shots = shotsByScene.get(scene.id) ?? [];
            const status = sceneStatusLabel(t, scene.status);
            return (
              <Fragment key={scene.id}>
                <Strip
                  phase={scenePhase(scene.status)}
                  stageLabel={status}
                  number={t("scenes.board.code", { order: scene.order })}
                  title={scene.title}
                  owner={sceneTypeLabel(t, scene.type)}
                  date={status}
                  meta={t("scenes.board.shotCount", { count: shots.length })}
                  tip={sceneTip(scene.status)}
                  href={
                    canEdit
                      ? `/producoes/${project.id}/cenas/${scene.id}`
                      : undefined
                  }
                  action={
                    canEdit ? (
                      <span className="grid grid-cols-2 gap-0.5 sm:flex sm:justify-end">
                        <form action={moveSceneAction} className="contents">
                          <input
                            type="hidden"
                            name="projectId"
                            value={project.id}
                          />
                          <input
                            type="hidden"
                            name="sceneId"
                            value={scene.id}
                          />
                          <button
                            type="submit"
                            name="direction"
                            value="up"
                            disabled={index === 0}
                            aria-label={t("scenes.board.moveUp", {
                              title: scene.title,
                            })}
                            title={t("common.moveUp")}
                            className={stripIconButton}
                          >
                            <ArrowUp aria-hidden="true" />
                          </button>
                          <button
                            type="submit"
                            name="direction"
                            value="down"
                            disabled={index === scenes.length - 1}
                            aria-label={t("scenes.board.moveDown", {
                              title: scene.title,
                            })}
                            title={t("common.moveDown")}
                            className={stripIconButton}
                          >
                            <ArrowDown aria-hidden="true" />
                          </button>
                        </form>
                        <form
                          action={duplicateSceneAction}
                          className="contents"
                        >
                          <input
                            type="hidden"
                            name="projectId"
                            value={project.id}
                          />
                          <input
                            type="hidden"
                            name="sceneId"
                            value={scene.id}
                          />
                          <button
                            type="submit"
                            aria-label={t("scenes.board.duplicate", {
                              title: scene.title,
                            })}
                            title={t("scenes.duplicate")}
                            className={stripIconButton}
                          >
                            <Copy aria-hidden="true" />
                          </button>
                        </form>
                        <DeleteSceneButton
                          projectId={project.id}
                          sceneId={scene.id}
                          compactLabel={t("scenes.board.delete", {
                            title: scene.title,
                          })}
                        />
                      </span>
                    ) : null
                  }
                />
                {shots.length > 0 ? (
                  // Planos como sub-tiras da cena, recuados sob a etiqueta.
                  <li>
                    <ol
                      aria-label={t("scenes.board.shotsOf", {
                        title: scene.title,
                      })}
                      className="flex flex-col gap-px pl-6 sm:pl-[3.375rem]"
                    >
                      {shots.map((shot, shotIndex) => (
                        <li
                          key={shot.id}
                          className="flex min-h-7 items-baseline gap-2 rounded-[2px] bg-card px-2 py-1 text-xs"
                        >
                          <span className="shrink-0 font-condensed font-semibold tracking-wide uppercase">
                            {shotDisplayName(t, shot.name, shotIndex)}
                          </span>
                          <span className="min-w-0 truncate text-muted-foreground">
                            {shotSummary(t, shot)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </li>
                ) : null}
              </Fragment>
            );
          })}
        </StripBoard>
      )}
      {canEdit ? (
        <section className={cn(surfaceClass, "space-y-3 p-3")}>
          <h2 className="font-condensed text-sm font-semibold tracking-wider uppercase">
            {t("scenes.new")}
          </h2>
          <SceneForm
            editing={false}
            people={people}
            values={{
              projectId: project.id,
              title: "",
              description: "",
              type: "OTHER",
              speakerId: "",
              dialogue: "",
              action: "",
              estimatedDurationSeconds: "",
              cameraInstructions: "",
              editingInstructions: "",
              continuityNotes: "",
              status: "PLANNED",
            }}
          />
        </section>
      ) : null}
    </div>
  );
}
