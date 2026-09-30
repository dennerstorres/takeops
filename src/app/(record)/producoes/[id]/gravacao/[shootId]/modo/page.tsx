import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { TakeList } from "@/components/takes/take-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { prismaProjectRepository } from "@/server/project-prisma";
import { listScenes } from "@/server/scene";
import { sceneStatusLabel } from "@/server/scene-labels";
import { prismaSceneRepository } from "@/server/scene-prisma";
import { buildRecordView, clampPosition } from "@/server/record-view";
import { recordSceneStatusAction } from "@/server/scene-actions";
import { getShoot } from "@/server/shoot";
import { prismaShootRepository } from "@/server/shoot-prisma";
import { listShotsByScene } from "@/server/shot";
import { shotDisplayName, shotSummary } from "@/server/shot-labels";
import { prismaShotRepository } from "@/server/shot-prisma";
import { listTakes } from "@/server/take";
import { prismaTakeRepository } from "@/server/take-prisma";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

function personLabel(
  member: { name: string | null; email: string | null },
  fallback: string,
) {
  return member.name || member.email || fallback;
}

export default async function RecordModePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; shootId: string }>;
  searchParams: Promise<{ cena?: string | string[] }>;
}) {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const { id, shootId } = await params;
  const workspaceId = access.workspace.workspace.id;
  const deps = {
    workspaces: prismaWorkspaceRepository,
    projects: prismaProjectRepository,
    scenes: prismaSceneRepository,
    shots: prismaShotRepository,
    shoots: prismaShootRepository,
    takes: prismaTakeRepository,
  };
  const canEdit = access.workspace.membership.role !== "VIEWER";

  let shoot;
  let scenes;
  let shotsByScene;
  let team;
  try {
    shoot = await getShoot(session.user.id, workspaceId, id, shootId, deps);
    [scenes, shotsByScene, team] = await Promise.all([
      listScenes(
        session.user.id,
        workspaceId,
        id,
        deps.workspaces,
        deps.projects,
        deps.scenes,
      ),
      listShotsByScene(session.user.id, workspaceId, id, deps),
      listTeam(session.user.id, workspaceId, deps.workspaces),
    ]);
  } catch (error) {
    if (error instanceof NotFoundError) redirect(`/producoes/${id}/gravacao`);
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  const view = buildRecordView(
    scenes,
    shotsByScene,
    team.map((member) => ({
      id: member.userId,
      label: personLabel(member, t("common.noName")),
    })),
    clampPosition((await searchParams).cena, scenes.length),
  );
  const exit = `/producoes/${id}/gravacao`;
  const here = `/producoes/${id}/gravacao/${shoot.id}/modo`;

  let takes = new Map<string, Awaited<ReturnType<typeof listTakes>>>();
  if (view !== null) {
    const sceneId = view.scene.id;
    try {
      takes = new Map(
        await Promise.all(
          view.shots.map(
            async (shot) =>
              [
                shot.id,
                await listTakes(
                  session.user.id,
                  workspaceId,
                  { projectId: id, sceneId, shotId: shot.id },
                  deps,
                ),
              ] as const,
          ),
        ),
      );
    } catch (error) {
      if (error instanceof NotFoundError) redirect(here);
      if (error instanceof ForbiddenError) redirect("/comecar");
      throw error;
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background px-4 py-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full bg-record"
            />
            {t("tabs.recording")}
          </p>
          <p className="truncate text-sm">
            {shoot.title || t("record.session")}
          </p>
        </div>
        <Link
          href={exit}
          className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
        >
          {t("record.exit")}
        </Link>
      </header>
      {view === null ? (
        <div className="p-4">
          <EmptyState
            title={t("record.emptyTitle")}
            description={t("record.emptyDescription")}
          />
        </div>
      ) : (
        <main className="flex flex-1 flex-col gap-5 px-4 py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {t("record.scenesDone", { done: view.done, total: view.total })}
              {view.retakes > 0 ? (
                <span className="font-normal text-warning">
                  {t("record.retakes", { count: view.retakes })}
                </span>
              ) : null}
            </p>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={t("record.doneLabel")}
              aria-valuemin={0}
              aria-valuemax={view.total}
              aria-valuenow={view.done}
            >
              <div
                className="h-full bg-primary"
                style={{ width: `${(view.done / view.total) * 100}%` }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                {t("record.scenePosition", {
                  position: view.position,
                  total: view.total,
                })}
              </span>
              <StatusBadge status={view.scene.status}>
                {sceneStatusLabel(t, view.scene.status)}
              </StatusBadge>
            </p>
            <h1 className="text-2xl font-medium tracking-tight">
              {view.scene.title}
            </h1>
          </div>
          {view.scene.dialogue || view.scene.speaker ? (
            <section className="space-y-2">
              {view.scene.speaker ? (
                <p className="text-sm font-medium tracking-wide uppercase">
                  {view.scene.speaker}
                </p>
              ) : null}
              {view.scene.dialogue ? (
                <p className="text-xl leading-relaxed whitespace-pre-wrap">
                  {view.scene.dialogue}
                </p>
              ) : null}
            </section>
          ) : null}
          {view.scene.action ? (
            <p className="text-base whitespace-pre-wrap">{view.scene.action}</p>
          ) : null}
          {view.shots.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-sm font-medium">
                {t("record.shotsAndTakes")}
              </h2>
              <ul className="flex flex-col gap-2">
                {view.shots.map((shot, index) => (
                  <li key={shot.id} className={cn(surfaceClass, "p-3")}>
                    <p className="text-base font-medium">
                      {shotDisplayName(t, shot.name, index)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {shotSummary(t, shot)}
                    </p>
                    {shot.description ? (
                      <p className="mt-1 text-base whitespace-pre-wrap">
                        {shot.description}
                      </p>
                    ) : null}
                    <div className="mt-3 border-t pt-3">
                      <TakeList
                        projectId={id}
                        sceneId={view.scene.id}
                        shotId={shot.id}
                        takes={takes.get(shot.id) ?? []}
                        requiredTakes={shot.requiredTakes}
                        canEdit={canEdit}
                        returnTo={`${here}?cena=${view.position}`}
                        record
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p
              className={cn(surfaceClass, "p-3 text-sm text-muted-foreground")}
            >
              {t("record.noShot")}
            </p>
          )}
          {view.scene.cameraInstructions ? (
            <section className="space-y-1">
              <h2 className="text-sm font-medium">{t("scenes.camera")}</h2>
              <p className="text-base whitespace-pre-wrap">
                {view.scene.cameraInstructions}
              </p>
            </section>
          ) : null}
          {view.scene.editingInstructions ? (
            <section className="space-y-1">
              <h2 className="text-sm font-medium">{t("tabs.editing")}</h2>
              <p className="text-base whitespace-pre-wrap">
                {view.scene.editingInstructions}
              </p>
            </section>
          ) : null}
          {view.scene.continuityNotes ? (
            <section
              role="note"
              className={cn(
                surfaceClass,
                "space-y-1 border-warning/40 bg-warning-muted p-3 text-warning",
              )}
            >
              <h2 className="text-sm font-medium">{t("record.attention")}</h2>
              <p className="text-base whitespace-pre-wrap">
                {view.scene.continuityNotes}
              </p>
            </section>
          ) : null}
        </main>
      )}
      {view !== null && (canEdit || view.total > 1) ? (
        <footer className="sticky bottom-0 z-10 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
            {canEdit ? (
              <form
                action={recordSceneStatusAction}
                className="flex flex-col gap-2"
              >
                <input type="hidden" name="projectId" value={id} />
                <input type="hidden" name="sceneId" value={view.scene.id} />
                <input
                  type="hidden"
                  name="returnTo"
                  value={`${here}?cena=${view.position}`}
                />
                <input
                  type="hidden"
                  name="nextTo"
                  value={view.next !== null ? `${here}?cena=${view.next}` : ""}
                />
                <Button
                  type="submit"
                  name="status"
                  value="NEEDS_RETAKE"
                  variant="outline"
                  aria-pressed={view.scene.status === "NEEDS_RETAKE"}
                  className="w-full"
                >
                  {t("record.needsRetake")}
                </Button>
                <Button
                  type="submit"
                  name="status"
                  value="RECORDED"
                  aria-pressed={view.scene.status === "RECORDED"}
                  className="w-full"
                >
                  {view.next !== null
                    ? t("record.doneAndNext")
                    : t("record.done")}
                </Button>
              </form>
            ) : null}
            {view.total > 1 ? (
              <nav
                aria-label={t("tabs.scenes")}
                className="grid grid-cols-2 gap-2"
              >
                {view.previous !== null ? (
                  <Link
                    href={`${here}?cena=${view.previous}`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    {t("record.previous")}
                  </Link>
                ) : (
                  <span aria-hidden />
                )}
                {view.next !== null ? (
                  <Link
                    href={`${here}?cena=${view.next}`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    {t("record.next")}
                  </Link>
                ) : (
                  <span aria-hidden />
                )}
              </nav>
            ) : null}
          </div>
        </footer>
      ) : null}
    </div>
  );
}
