import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProductionTabs } from "@/components/projects/production-tabs";
import { DeleteSceneButton } from "@/components/scenes/delete-scene-button";
import { SceneForm } from "@/components/scenes/scene-form";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { getProject } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { listScenes } from "@/server/scene";
import { sceneStatusLabel, sceneTypeLabel } from "@/server/scene-labels";
import { prismaSceneRepository } from "@/server/scene-prisma";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

function personLabel(member: { name: string | null; email: string | null }) {
  return member.name || member.email || "Sem nome";
}

export default async function ScenesPage({
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
  const canEdit = access.workspace.membership.role !== "VIEWER";

  let project;
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
    [scenes, team] = await Promise.all([
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

  const people = team.map((member) => ({
    id: member.userId,
    label: personLabel(member),
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ProductionTabs projectId={project.id} active="Cenas" />
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">Cenas</h1>
        <p className="text-sm text-muted-foreground">{project.title}</p>
      </header>
      {scenes.length === 0 ? (
        <EmptyState
          title="Nenhuma cena"
          description="As cenas desta produção aparecem aqui."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {scenes.map((scene) => (
            <li key={scene.id} className="rounded-xl border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">
                    {scene.order}. {scene.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {sceneTypeLabel(scene.type)} · {sceneStatusLabel(scene.status)}
                  </p>
                </div>
                {canEdit ? (
                  <div className="flex gap-2">
                    <Link
                      href={`/producoes/${project.id}/cenas/${scene.id}`}
                      className="inline-flex min-h-11 items-center rounded-lg border px-3 text-sm"
                    >
                      Editar
                    </Link>
                    <DeleteSceneButton projectId={project.id} sceneId={scene.id} />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      {canEdit ? (
        <section className="space-y-3">
          <h2 className="text-base font-medium">Nova cena</h2>
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
