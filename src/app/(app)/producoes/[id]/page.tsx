import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import {
  ParticipantForm,
  RemoveParticipantButton,
} from "@/components/projects/participant-form";
import { ProjectForm } from "@/components/projects/project-form";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { NotFoundError } from "@/server/errors";
import { listIdeas } from "@/server/idea";
import { prismaIdeaRepository } from "@/server/idea-prisma";
import { listParticipants } from "@/server/participant";
import { prismaParticipantRepository } from "@/server/participant-prisma";
import { projectRoleLabel } from "@/server/participant-labels";
import { getProject } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { projectStatusLabel } from "@/server/project-labels";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

function dateInput(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function ProductionPage({
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

  let project;
  try {
    project = await getProject(
      session.user.id,
      workspaceId,
      id,
      prismaWorkspaceRepository,
      prismaProjectRepository,
    );
  } catch (error) {
    if (!(error instanceof NotFoundError)) throw error;
    project = null;
  }

  if (!project) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <h1 className="text-2xl font-medium tracking-tight">Produção</h1>
        <p className="text-sm text-muted-foreground">
          Esta produção não está na lista.
        </p>
        <Link
          href="/producoes"
          className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
        >
          Voltar para a lista
        </Link>
      </div>
    );
  }

  const canEdit = access.workspace.membership.role !== "VIEWER";
  const participants = await listParticipants(
    session.user.id,
    workspaceId,
    project.id,
    prismaWorkspaceRepository,
    prismaProjectRepository,
    prismaParticipantRepository,
  );
  const [people, ideas] = await Promise.all([
    listTeam(session.user.id, workspaceId, prismaWorkspaceRepository),
    listIdeas(
      session.user.id,
      workspaceId,
      prismaWorkspaceRepository,
      prismaIdeaRepository,
    ),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">
            {project.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {projectStatusLabel(project.status)}
          </p>
        </div>
        {canEdit ? <DeleteProjectButton projectId={project.id} /> : null}
      </header>
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">Participantes</h2>
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ninguém foi adicionado ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {participants.map((person) => (
              <li
                key={person.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {person.name ?? person.email ?? "Sem nome"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {projectRoleLabel(person.role)}
                  </p>
                </div>
                {canEdit ? (
                  <RemoveParticipantButton
                    projectId={project.id}
                    userId={person.userId}
                    role={person.role}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {canEdit ? (
          <ParticipantForm
            projectId={project.id}
            people={people.map((person) => ({
              id: person.userId,
              label: person.name ?? person.email ?? "Sem nome",
            }))}
          />
        ) : null}
      </section>
      <ProjectForm
        canEdit={canEdit}
        people={people.map((person) => ({
          id: person.userId,
          label: person.name ?? person.email ?? "Sem nome",
        }))}
        ideas={ideas.map((idea) => ({ id: idea.id, label: idea.title }))}
        values={{
          id: project.id,
          title: project.title,
          slug: project.slug ?? "",
          description: project.description ?? "",
          objective: project.objective ?? "",
          audience: project.audience ?? "",
          product: project.product ?? "",
          format: project.format,
          aspectRatio: project.aspectRatio,
          estimatedDurationSeconds:
            project.estimatedDurationSeconds?.toString() ?? "",
          priority: project.priority,
          thumbnailUrl: project.thumbnailUrl ?? "",
          ownerId: project.ownerId ?? "",
          plannedShootDate: dateInput(project.plannedShootDate),
          plannedPublishDate: dateInput(project.plannedPublishDate),
          sourceIdeaId: project.sourceIdeaId ?? "",
        }}
      />
      <Link
        href="/producoes"
        className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
      >
        Voltar para a lista
      </Link>
    </div>
  );
}
