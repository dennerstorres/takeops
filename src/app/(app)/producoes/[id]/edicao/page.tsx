import { redirect } from "next/navigation";
import { EditVersionForm } from "@/components/editing/edit-version-form";
import { EditingForm } from "@/components/editing/editing-form";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProductionTabs } from "@/components/projects/production-tabs";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { listEditVersions, versionLabel } from "@/server/edit-version";
import { prismaEditVersionRepository } from "@/server/edit-version-prisma";
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
  const timezone = access.workspace.workspace.timezone;

  let project;
  let info;
  let team;
  let participants;
  let versions;
  try {
    project = await getProject(
      session.user.id,
      workspaceId,
      id,
      prismaWorkspaceRepository,
      prismaProjectRepository,
    );
    [info, team, participants, versions] = await Promise.all([
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
      listEditVersions(session.user.id, workspaceId, project.id, {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        versions: prismaEditVersionRepository,
      }),
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

  const names = new Map(
    team.map((member) => [member.userId, personLabel(member)]),
  );
  const dateTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const linkClass =
    "inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4";

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
      <section id="versoes" className="flex flex-col gap-3 border-t pt-6">
        <h2 className="text-base font-medium">Versões</h2>
        {canEdit ? (
          <details className="rounded-xl border p-3">
            <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium">
              Nova versão
            </summary>
            <div className="mt-2">
              <EditVersionForm
                projectId={project.id}
                nextLabel={versionLabel((versions[0]?.versionNumber ?? 0) + 1)}
              />
            </div>
          </details>
        ) : null}
        {versions.length === 0 ? (
          <EmptyState
            title="Nenhuma versão"
            description="Cada corte enviado para revisão aparece aqui, do mais novo ao mais antigo."
          />
        ) : (
          <ol className="flex flex-col gap-3">
            {versions.map((version) => (
              <li key={version.id} className="rounded-xl border p-3">
                <p className="text-sm font-medium">
                  {versionLabel(version.versionNumber)}
                  {version.title ? ` · ${version.title}` : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  <time dateTime={version.createdAt.toISOString()}>
                    {dateTime.format(version.createdAt)}
                  </time>
                  {version.createdById && names.has(version.createdById)
                    ? ` · ${names.get(version.createdById)}`
                    : null}
                </p>
                {version.notes ? (
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {version.notes}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-x-4">
                  {version.previewUrl ? (
                    <a
                      href={version.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      Assistir preview
                    </a>
                  ) : null}
                  {version.fileUrl ? (
                    <a
                      href={version.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      Abrir arquivo
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
