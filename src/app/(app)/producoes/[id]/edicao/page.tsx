import { redirect } from "next/navigation";
import { EditingForm } from "@/components/editing/editing-form";
import { ProductionTabs } from "@/components/projects/production-tabs";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { getEditingInfo } from "@/server/editing";
import { prismaEditingRepository } from "@/server/editing-prisma";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { listParticipants } from "@/server/participant";
import { prismaParticipantRepository } from "@/server/participant-prisma";
import { getProject } from "@/server/project";
import { aspectLabel } from "@/server/project-labels";
import { prismaProjectRepository } from "@/server/project-prisma";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

function personLabel(member: { name: string | null; email: string | null }) {
  return member.name || member.email || "Sem nome";
}

export default async function EditingPage({
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
  let info;
  let team;
  let participants;
  try {
    project = await getProject(
      session.user.id,
      workspaceId,
      id,
      prismaWorkspaceRepository,
      prismaProjectRepository,
    );
    [info, team, participants] = await Promise.all([
      getEditingInfo(session.user.id, workspaceId, project.id, {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        editing: prismaEditingRepository,
      }),
      listTeam(session.user.id, workspaceId, prismaWorkspaceRepository),
      listParticipants(
        session.user.id,
        workspaceId,
        project.id,
        prismaWorkspaceRepository,
        prismaProjectRepository,
        prismaParticipantRepository,
      ),
    ]);
  } catch (error) {
    if (error instanceof NotFoundError) redirect("/producoes");
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  // Quem já é editor na produção aparece primeiro e marcado.
  const editors = new Set(
    participants
      .filter((person) => person.role === "EDITOR")
      .map((person) => person.userId),
  );
  const people = team
    .map((member) => ({
      id: member.userId,
      label: editors.has(member.userId)
        ? `${personLabel(member)} · editor da produção`
        : personLabel(member),
      editor: editors.has(member.userId),
    }))
    .sort((left, right) => Number(right.editor) - Number(left.editor));
  const editorName = info?.editorId
    ? (people.find((person) => person.id === info.editorId)?.label ?? null)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ProductionTabs projectId={project.id} active="Edição" />
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">Edição</h1>
        <p className="text-sm text-muted-foreground">{project.title}</p>
      </header>
      {canEdit ? (
        <EditingForm
          people={people.map(({ id: personId, label }) => ({
            id: personId,
            label,
          }))}
          values={{
            projectId: project.id,
            editorId: info?.editorId ?? "",
            software: info?.software ?? "",
            projectFileUrl: info?.projectFileUrl ?? "",
            notes: info?.notes ?? "",
            targetResolution: info?.targetResolution ?? "",
            targetFps: info?.targetFps?.toString() ?? "",
            aspectRatio: info?.aspectRatio ?? "",
            captionsRequired: info?.captionsRequired ?? false,
            musicRequired: info?.musicRequired ?? false,
          }}
        />
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            ["Editor", editorName],
            ["Software", info?.software],
            ["Resolução", info?.targetResolution],
            ["FPS", info?.targetFps?.toString()],
            [
              "Proporção",
              info?.aspectRatio ? aspectLabel(info.aspectRatio) : null,
            ],
            ["Legenda", info ? (info.captionsRequired ? "Sim" : "Não") : null],
            ["Música", info ? (info.musicRequired ? "Sim" : "Não") : null],
          ].map(([label, value]) => (
            <div key={label} className="space-y-1">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-sm font-medium">
                {value ?? "Não informado"}
              </dd>
            </div>
          ))}
          {info?.projectFileUrl ? (
            <div className="space-y-1 sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Projeto</dt>
              <dd>
                <a
                  href={info.projectFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-sm font-medium break-all underline underline-offset-4"
                >
                  Abrir projeto de edição
                </a>
              </dd>
            </div>
          ) : null}
          {info?.notes ? (
            <div className="space-y-1 sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Notas</dt>
              <dd className="text-sm whitespace-pre-wrap">{info.notes}</dd>
            </div>
          ) : null}
        </dl>
      )}
    </div>
  );
}
