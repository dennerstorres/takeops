import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ParticipantForm,
  RemoveParticipantButton,
} from "@/components/projects/participant-form";
import { ProductionTabs } from "@/components/projects/production-tabs";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { NotFoundError } from "@/server/errors";
import { listParticipants } from "@/server/participant";
import { prismaParticipantRepository } from "@/server/participant-prisma";
import { projectRoleLabel } from "@/server/participant-labels";
import { getProject } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { buildProjectOverview } from "@/server/project-overview";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

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
  const [participants, people] = await Promise.all([
    listParticipants(
      session.user.id,
      workspaceId,
      project.id,
      prismaWorkspaceRepository,
      prismaProjectRepository,
      prismaParticipantRepository,
    ),
    listTeam(session.user.id, workspaceId, prismaWorkspaceRepository),
  ]);
  const owner = people.find((person) => person.userId === project.ownerId);
  const overview = buildProjectOverview({
    project,
    ownerName: owner ? (owner.name ?? owner.email ?? "Sem nome") : null,
    participants,
  });
  const facts = [
    ["Objetivo", overview.objective],
    ["Produto", overview.product],
    ["Público", overview.audience],
    ["Formato", overview.format],
    ["Proporção", overview.aspectRatio],
    ["Duração", overview.duration],
    ["Status", overview.status],
    ["Prioridade", overview.priority],
    ["Gravação", overview.shootDate],
    ["Publicação", overview.publishDate],
    ["Responsável", overview.ownerName],
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">
            {overview.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Progresso {overview.progress}
          </p>
        </div>
        {canEdit ? (
          <Link
            href={`/producoes/${project.id}/editar`}
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-medium"
          >
            Editar
          </Link>
        ) : null}
      </header>
      <ProductionTabs projectId={project.id} />
      <dl className="grid gap-3 sm:grid-cols-2">
        {facts.map(([label, value]) => (
          <div key={label} className="rounded-xl border p-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium">{value ?? "Não informado"}</dd>
          </div>
        ))}
      </dl>
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">Links</h2>
        {overview.links.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum link.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {overview.links.map((link) => (
              <li key={link.href}>
                {link.href.startsWith("/") ? (
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">Participantes</h2>
        {overview.participants.length === 0 ? (
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
      <Link
        href="/producoes"
        className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
      >
        Voltar para a lista
      </Link>
    </div>
  );
}
