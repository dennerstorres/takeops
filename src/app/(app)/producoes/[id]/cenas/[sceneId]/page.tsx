import Link from "next/link";
import { redirect } from "next/navigation";
import { SceneForm } from "@/components/scenes/scene-form";
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
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

function personLabel(member: { name: string | null; email: string | null }) {
  return member.name || member.email || "Sem nome";
}

export default async function EditScenePage({
  params,
}: {
  params: Promise<{ id: string; sceneId: string }>;
}) {
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
    shots = await listShots(
      session.user.id,
      workspaceId,
      project.id,
      scene.id,
      {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        scenes: prismaSceneRepository,
        shots: prismaShotRepository,
      },
    );
  } catch (error) {
    if (error instanceof NotFoundError) redirect(`/producoes/${id}/cenas`);
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href={`/producoes/${project.id}/cenas`}
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground"
      >
        Voltar às cenas
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">Editar cena</h1>
        <p className="text-sm text-muted-foreground">
          {scene.order}. {project.title}
        </p>
      </header>
      <SceneForm
        editing
        people={team.map((member) => ({
          id: member.userId,
          label: personLabel(member),
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
        canEdit
      />
    </div>
  );
}
