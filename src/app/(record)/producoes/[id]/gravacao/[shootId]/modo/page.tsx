import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { prismaProjectRepository } from "@/server/project-prisma";
import { listScenes } from "@/server/scene";
import { sceneStatusLabel } from "@/server/scene-labels";
import { prismaSceneRepository } from "@/server/scene-prisma";
import { buildRecordView } from "@/server/record-view";
import { getShoot } from "@/server/shoot";
import { prismaShootRepository } from "@/server/shoot-prisma";
import { listShotsByScene } from "@/server/shot";
import { shotDisplayName, shotSummary } from "@/server/shot-labels";
import { prismaShotRepository } from "@/server/shot-prisma";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

function personLabel(member: { name: string | null; email: string | null }) {
  return member.name || member.email || "Sem nome";
}

export default async function RecordModePage({
  params,
}: {
  params: Promise<{ id: string; shootId: string }>;
}) {
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
  };

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
      label: personLabel(member),
    })),
    1,
  );
  const exit = `/producoes/${id}/gravacao`;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background px-4 py-2">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Gravação
          </p>
          <p className="truncate text-sm">
            {shoot.title || "Sessão de gravação"}
          </p>
        </div>
        <Link
          href={exit}
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg border px-3 text-sm"
        >
          Sair
        </Link>
      </header>
      {view === null ? (
        <div className="p-4">
          <EmptyState
            title="Nenhuma cena para gravar"
            description="Crie cenas na aba Cenas para usar o Modo Gravação."
          />
        </div>
      ) : (
        <main className="flex flex-1 flex-col gap-5 px-4 py-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Cena {view.position} de {view.total} ·{" "}
              {sceneStatusLabel(view.scene.status)}
            </p>
            <h1 className="text-xl font-medium tracking-tight">
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
                <p className="text-lg leading-relaxed whitespace-pre-wrap">
                  {view.scene.dialogue}
                </p>
              ) : null}
            </section>
          ) : null}
          {view.scene.action ? (
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {view.scene.action}
            </p>
          ) : null}
          {view.shots.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-sm font-medium">Shots</h2>
              <ul className="flex flex-col gap-2">
                {view.shots.map((shot, index) => (
                  <li key={shot.id} className="rounded-xl border p-3">
                    <p className="text-sm font-medium">
                      {shotDisplayName(shot.name, index)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {shotSummary(shot)}
                    </p>
                    {shot.description ? (
                      <p className="mt-1 text-sm whitespace-pre-wrap">
                        {shot.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {view.scene.cameraInstructions ? (
            <section className="space-y-1">
              <h2 className="text-sm font-medium">Câmera</h2>
              <p className="text-sm whitespace-pre-wrap">
                {view.scene.cameraInstructions}
              </p>
            </section>
          ) : null}
          {view.scene.editingInstructions ? (
            <section className="space-y-1">
              <h2 className="text-sm font-medium">Edição</h2>
              <p className="text-sm whitespace-pre-wrap">
                {view.scene.editingInstructions}
              </p>
            </section>
          ) : null}
          {view.scene.continuityNotes ? (
            <section
              role="note"
              className="space-y-1 rounded-xl border border-amber-500/50 bg-amber-500/10 p-3"
            >
              <h2 className="text-sm font-medium">Atenção</h2>
              <p className="text-sm whitespace-pre-wrap">
                {view.scene.continuityNotes}
              </p>
            </section>
          ) : null}
        </main>
      )}
    </div>
  );
}
