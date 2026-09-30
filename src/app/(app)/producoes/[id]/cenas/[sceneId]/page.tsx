import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SceneForm } from "@/components/scenes/scene-form";
import { ProductionTabs } from "@/components/projects/production-tabs";
import { stripPhaseClass } from "@/components/ui/strip";
import { scenePhase } from "@/components/ui/strip-phase";
import { cn } from "@/lib/utils";
import { sceneStatusLabel } from "@/server/scene-labels";
import { ShotSection } from "@/components/shots/shot-section";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { getProject } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { getScene } from "@/server/scene";
import { prismaSceneRepository } from "@/server/scene-prisma";
import { listShots } from "@/server/shot";
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

export default async function EditScenePage({
  params,
}: {
  params: Promise<{ id: string; sceneId: string }>;
}) {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  if (access.workspace.membership.role === "VIEWER") {
    const { id } = await params;
    redirect(`/producoes/${id}/cenas`);
  }
  const { id, sceneId } = await params;
  const workspaceId = access.workspace.workspace.id;

  let project;
  let scene;
  let team;
  let shots;
  let takes;
  try {
    project = await getProject(
      session.user.id,
      workspaceId,
      id,
      prismaWorkspaceRepository,
      prismaProjectRepository,
    );
    [scene, team] = await Promise.all([
      getScene(
        session.user.id,
        workspaceId,
        project.id,
        sceneId,
        prismaWorkspaceRepository,
        prismaProjectRepository,
        prismaSceneRepository,
      ),
      listTeam(session.user.id, workspaceId, prismaWorkspaceRepository),
    ]);
    const deps = {
      workspaces: prismaWorkspaceRepository,
      projects: prismaProjectRepository,
      scenes: prismaSceneRepository,
      shots: prismaShotRepository,
      takes: prismaTakeRepository,
    };
    shots = await listShots(
      session.user.id,
      workspaceId,
      project.id,
      scene.id,
      deps,
    );
    const where = { userId: session.user.id, projectId: project.id };
    const foundSceneId = scene.id;
    takes = new Map(
      await Promise.all(
        shots.map(
          async (shot) =>
            [
              shot.id,
              await listTakes(
                where.userId,
                workspaceId,
                {
                  projectId: where.projectId,
                  sceneId: foundSceneId,
                  shotId: shot.id,
                },
                deps,
              ),
            ] as const,
        ),
      ),
    );
  } catch (error) {
    if (error instanceof NotFoundError) redirect(`/producoes/${id}/cenas`);
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <ProductionTabs project={project} active="Cenas" canEdit />
      {/* A cena aberta é a tira ampliada, com o mesmo código e cor do quadro. */}
      <header
        className={cn(
          "flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 rounded-md py-1 pr-1 pl-3 text-strip-ink",
          stripPhaseClass[scenePhase(scene.status)],
        )}
      >
        <h1 className="min-w-0 flex-1 font-condensed text-lg font-semibold tracking-wide">
          {t("scenes.board.code", { order: scene.order })} · {scene.title}
        </h1>
        <span className="font-condensed text-xs font-semibold tracking-wide uppercase">
          {sceneStatusLabel(t, scene.status)}
        </span>
        <Link
          href={`/producoes/${project.id}/cenas`}
          className="inline-flex h-11 items-center rounded-[2px] border border-strip-ink/25 px-2.5 font-condensed text-xs font-semibold tracking-wider uppercase transition-colors hover:bg-strip-ink/5 focus-visible:outline-2 focus-visible:outline-ring sm:h-7"
        >
          {t("scenes.back")}
        </Link>
      </header>
      <SceneForm
        editing
        people={team.map((member) => ({
          id: member.userId,
          label: personLabel(member, t("common.noName")),
        }))}
        values={{
          projectId: project.id,
          sceneId: scene.id,
          title: scene.title,
          description: scene.description ?? "",
          type: scene.type,
          speakerId: scene.speakerId ?? "",
          dialogue: scene.dialogue ?? "",
          action: scene.action ?? "",
          estimatedDurationSeconds:
            scene.estimatedDurationSeconds?.toString() ?? "",
          cameraInstructions: scene.cameraInstructions ?? "",
          editingInstructions: scene.editingInstructions ?? "",
          continuityNotes: scene.continuityNotes ?? "",
          status: scene.status,
        }}
      />
      <ShotSection
        projectId={project.id}
        sceneId={scene.id}
        shots={shots}
        takes={takes}
        canEdit
      />
    </div>
  );
}
