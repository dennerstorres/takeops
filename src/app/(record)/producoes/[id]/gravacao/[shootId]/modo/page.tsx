import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { TakeList } from "@/components/takes/take-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { stripPhaseClass, stripTipClass } from "@/components/ui/strip";
import { scenePhase, sceneTip } from "@/components/ui/strip-phase";
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
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b-2 border-divider bg-frame px-4 py-2 text-frame-foreground">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-condensed text-xs font-semibold tracking-wider uppercase">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full bg-record"
            />
            {t("tabs.recording")}
          </p>
          <p className="truncate text-sm font-medium">
            {shoot.title || t("record.session")}
          </p>
        </div>
        <Link
          href={exit}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "shrink-0 bg-card",
          )}
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
              className="h-2 overflow-hidden rounded-[2px] bg-frame"
              role="progressbar"
              aria-label={t("record.doneLabel")}
              aria-valuemin={0}
              aria-valuemax={view.total}
              aria-valuenow={view.done}
            >
              <div
                className="h-full bg-divider"
                style={{ width: `${(view.done / view.total) * 100}%` }}
              />
            </div>
          </div>
          <section
            className={cn(
              "flex flex-col gap-2 rounded-md p-3 text-strip-ink",
              stripPhaseClass[scenePhase(view.scene.status)],
            )}
          >
            <p className="flex items-center justify-between gap-3 font-condensed text-sm font-semibold tracking-wider uppercase">
              <span>
                {t("record.scenePosition", {
                  position: view.position,
                  total: view.total,
                })}
              </span>
              <span className="flex items-center gap-2">
                {sceneStatusLabel(t, view.scene.status)}
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-5 w-2.5",
                    stripTipClass[sceneTip(view.scene.status)],
                  )}
                />
              </span>
            </p>
            <h1 className="text-2xl leading-tight font-semibold">
              {view.scene.title}
            </h1>
          </section>
          {view.scene.dialogue || view.scene.speaker ? (
            <section className="space-y-2">
              {view.scene.speaker ? (
                <p className="font-condensed text-sm font-semibold tracking-wider uppercase">
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
              <h2 className="font-condensed text-sm font-semibold tracking-wider uppercase">
                {t("record.shotsAndTakes")}
              </h2>
              <ul className="flex flex-col gap-2">
                {view.shots.map((shot, index) => (
                  <li
                    key={shot.id}
                    className="overflow-hidden rounded-md border bg-card"
                  >
                    <div
                      className={cn(
                        "flex min-h-11 flex-wrap items-baseline gap-x-2 border-b border-strip-ink/10 px-3 py-2 text-strip-ink",
                        stripPhaseClass[scenePhase(shot.status)],
                      )}
                    >
                      <span className="font-condensed text-base font-semibold tracking-wide uppercase">
                        {shotDisplayName(t, shot.name, index)}
                      </span>
                      <span className="text-sm text-strip-ink-muted">
                        {shotSummary(t, shot)}
                      </span>
                    </div>
                    {shot.description ? (
                      <p className="px-3 pt-3 text-base whitespace-pre-wrap">
                        {shot.description}
                      </p>
                    ) : null}
                    <div className="p-3">
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
              <h2 className="font-condensed text-sm font-semibold tracking-wider uppercase">
                {t("scenes.camera")}
              </h2>
              <p className="text-base whitespace-pre-wrap">
                {view.scene.cameraInstructions}
              </p>
            </section>
          ) : null}
          {view.scene.editingInstructions ? (
            <section className="space-y-1">
              <h2 className="font-condensed text-sm font-semibold tracking-wider uppercase">
                {t("tabs.editing")}
              </h2>
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
              <h2 className="font-condensed text-sm font-semibold tracking-wider uppercase">
                {t("record.attention")}
              </h2>
              <p className="text-base whitespace-pre-wrap">
                {view.scene.continuityNotes}
              </p>
            </section>
          ) : null}
        </main>
      )}
      {view !== null && (canEdit || view.total > 1) ? (
        <footer className="sticky bottom-0 z-10 border-t-2 border-divider bg-frame px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
