import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProductionTabs } from "@/components/projects/production-tabs";
import { DeleteSceneButton } from "@/components/scenes/delete-scene-button";
import { SceneForm } from "@/components/scenes/scene-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ProductionTabs projectId={project.id} active="Cenas" />
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">
          {t("tabs.scenes")}
        </h1>
        <p className="text-sm text-muted-foreground">{project.title}</p>
      </header>
      {scenes.length === 0 ? (
        <EmptyState
          title={t("scenes.emptyTitle")}
          description={t("scenes.emptyDescription")}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {scenes.map((scene, index) => (
            <li key={scene.id} className={cn(surfaceClass, "p-3")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">
                    {scene.order}. {scene.title}
                  </p>
                  <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>{sceneTypeLabel(t, scene.type)}</span>
                    <StatusBadge status={scene.status}>
                      {sceneStatusLabel(t, scene.status)}
                    </StatusBadge>
                  </p>
                </div>
                {canEdit ? (
                  <div className="flex flex-wrap gap-2">
                    <form action={moveSceneAction} className="flex gap-2">
                      <input
                        type="hidden"
                        name="projectId"
                        value={project.id}
                      />
                      <input type="hidden" name="sceneId" value={scene.id} />
                      <Button
                        type="submit"
                        name="direction"
                        value="up"
                        variant="outline"
                        disabled={index === 0}
                      >
                        {t("common.moveUp")}
                      </Button>
                      <Button
                        type="submit"
                        name="direction"
                        value="down"
                        variant="outline"
                        disabled={index === scenes.length - 1}
                      >
                        {t("common.moveDown")}
                      </Button>
                    </form>
                    <form action={duplicateSceneAction}>
                      <input
                        type="hidden"
                        name="projectId"
                        value={project.id}
                      />
                      <input type="hidden" name="sceneId" value={scene.id} />
                      <Button type="submit" variant="outline">
                        {t("scenes.duplicate")}
                      </Button>
                    </form>
                    <Link
                      href={`/producoes/${project.id}/cenas/${scene.id}`}
                      className={buttonVariants({ variant: "outline" })}
                    >
                      {t("scenes.editAndShots")}
                    </Link>
                    <DeleteSceneButton
                      projectId={project.id}
                      sceneId={scene.id}
                    />
                  </div>
                ) : null}
              </div>
              {shotsByScene.get(scene.id)?.length ? (
                <ol className="mt-3 flex flex-col gap-1 border-t pt-3">
                  {shotsByScene.get(scene.id)?.map((shot, shotIndex) => (
                    <li key={shot.id} className="text-sm">
                      <span className="font-medium">
                        {shotDisplayName(t, shot.name, shotIndex)}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {shotSummary(t, shot)}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {canEdit ? (
        <section className={cn(surfaceClass, "space-y-3 p-3")}>
          <h2 className="text-base font-medium">{t("scenes.new")}</h2>
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
