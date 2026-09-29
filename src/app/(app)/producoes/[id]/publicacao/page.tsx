import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProductionTabs } from "@/components/projects/production-tabs";
import { DeletePublicationButton } from "@/components/publications/delete-publication-button";
import { PublicationForm } from "@/components/publications/publication-form";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { getProject } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { listPublications } from "@/server/publication";
import {
  platformLabel,
  publicationStatusLabel,
} from "@/server/publication-labels";
import { prismaPublicationRepository } from "@/server/publication-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function PublicationsPage({
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
  const timezone = access.workspace.workspace.timezone;
  const canEdit = access.workspace.membership.role !== "VIEWER";
  const deps = {
    workspaces: prismaWorkspaceRepository,
    projects: prismaProjectRepository,
    publications: prismaPublicationRepository,
  };

  let project;
  let publications;
  try {
    project = await getProject(
      session.user.id,
      workspaceId,
      id,
      deps.workspaces,
      deps.projects,
    );
    publications = await listPublications(
      session.user.id,
      workspaceId,
      project.id,
      deps,
    );
  } catch (error) {
    if (error instanceof NotFoundError) redirect("/producoes");
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  const dateTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ProductionTabs projectId={project.id} active="Publicação" />
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">Publicação</h1>
        <p className="text-sm text-muted-foreground">
          {project.title} · a publicação é feita na plataforma; aqui fica o
          registro.
        </p>
      </header>
      {canEdit ? (
        <details className="rounded-xl border p-3">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium">
            Novo destino
          </summary>
          <div className="mt-2">
            <PublicationForm
              values={{
                projectId: project.id,
                platform: "INSTAGRAM_REELS",
                caption: "",
                notes: "",
              }}
            />
          </div>
        </details>
      ) : null}
      {publications.length === 0 ? (
        <EmptyState
          title="Nenhum destino"
          description="Cada plataforma onde o vídeo vai sair aparece aqui."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {publications.map((publication) => (
            <li key={publication.id} className="rounded-xl border p-3">
              <p className="text-sm font-medium">
                {platformLabel(publication.platform)}
                <span className="font-normal text-muted-foreground">
                  {" · "}
                  {publicationStatusLabel(publication.status)}
                </span>
              </p>
              {publication.scheduledAt ? (
                <p className="text-sm text-muted-foreground">
                  Agendada para{" "}
                  <time dateTime={publication.scheduledAt.toISOString()}>
                    {dateTime.format(publication.scheduledAt)}
                  </time>
                </p>
              ) : null}
              {publication.publishedAt ? (
                <p className="text-sm text-muted-foreground">
                  Publicada em{" "}
                  <time dateTime={publication.publishedAt.toISOString()}>
                    {dateTime.format(publication.publishedAt)}
                  </time>
                </p>
              ) : null}
              {publication.url ? (
                <a
                  href={publication.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
                >
                  Ver publicação
                </a>
              ) : null}
              {publication.caption ? (
                <p className="mt-1 text-sm whitespace-pre-wrap">
                  {publication.caption}
                </p>
              ) : null}
              {publication.notes ? (
                <p className="text-sm text-muted-foreground">
                  {publication.notes}
                </p>
              ) : null}
              {canEdit ? (
                <details className="mt-3 border-t pt-3">
                  <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm">
                    Editar destino
                  </summary>
                  <div className="mt-2 space-y-3">
                    <PublicationForm
                      values={{
                        projectId: project.id,
                        publicationId: publication.id,
                        platform: publication.platform,
                        caption: publication.caption ?? "",
                        notes: publication.notes ?? "",
                      }}
                    />
                    <DeletePublicationButton
                      projectId={project.id}
                      publicationId={publication.id}
                    />
                  </div>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
