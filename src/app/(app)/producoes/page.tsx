import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProductionBoard } from "@/components/projects/production-board";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ForbiddenError } from "@/server/errors";
import { prismaParticipantRepository } from "@/server/participant-prisma";
import { buildProjectBoard } from "@/server/project-board";
import { searchProjects } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import {
  priorityLabel,
  projectPriorities,
  projectStatusLabel,
  videoProjectStatuses,
} from "@/server/project-labels";
import { hasProjectSearch, parseProjectSearch } from "@/server/project-search";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";
import { Input, Select } from "@/components/ui/input";

function personLabel(member: { name: string | null; email: string | null }) {
  return member.name || member.email || "Sem nome";
}

export default async function ProductionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");

  const workspace = access.workspace.workspace;
  const canEdit = access.workspace.membership.role !== "VIEWER";
  const query = parseProjectSearch(await searchParams);
  let projects;
  let team;
  let board;
  try {
    [projects, team] = await Promise.all([
      searchProjects(
        session.user.id,
        workspace.id,
        query,
        prismaWorkspaceRepository,
        prismaProjectRepository,
        prismaParticipantRepository,
      ),
      listTeam(session.user.id, workspace.id, prismaWorkspaceRepository),
    ]);
    const participants = await prismaParticipantRepository.listByProjectIds(
      projects.map((project) => project.id),
    );
    board = buildProjectBoard(projects, participants, team, t);
  } catch (error) {
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  const filtering = hasProjectSearch(query);

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">Produções</h1>
          <p className="text-sm text-muted-foreground">
            Produções de {workspace.name}.
          </p>
        </div>
        {canEdit ? (
          <Link
            href="/producoes/nova"
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Nova produção
          </Link>
        ) : null}
      </header>
      <form
        method="get"
        className="grid gap-3 sm:grid-cols-2"
        aria-label="Filtros das produções"
      >
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Busca
          <Input name="q" defaultValue={query.text} placeholder="Título" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Status
          <Select name="status" defaultValue={query.status}>
            <option value="">Todos</option>
            {videoProjectStatuses.map((status) => (
              <option key={status} value={status}>
                {projectStatusLabel(t, status)}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Prioridade
          <Select name="priority" defaultValue={query.priority}>
            <option value="">Todas</option>
            {projectPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priorityLabel(t, priority)}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Responsável
          <Select name="ownerId" defaultValue={query.ownerId}>
            <option value="">Todos</option>
            {team.map((member) => (
              <option key={member.userId} value={member.userId}>
                {personLabel(member)}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Participante
          <Select name="participantId" defaultValue={query.participantId}>
            <option value="">Todos</option>
            {team.map((member) => (
              <option key={member.userId} value={member.userId}>
                {personLabel(member)}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Produto
          <Input name="product" defaultValue={query.product} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Gravação de
          <Input type="date" name="shootFrom" defaultValue={query.shootFrom} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Gravação até
          <Input type="date" name="shootTo" defaultValue={query.shootTo} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Publicação de
          <Input
            type="date"
            name="publishFrom"
            defaultValue={query.publishFrom}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Publicação até
          <Input type="date" name="publishTo" defaultValue={query.publishTo} />
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Filtrar
          </button>
          <Link
            href="/producoes"
            className="inline-flex min-h-11 items-center rounded-lg border px-3 text-sm"
          >
            Limpar
          </Link>
        </div>
      </form>
      {projects.length === 0 ? (
        <EmptyState
          title={filtering ? "Nenhuma produção encontrada" : "Nenhuma produção"}
          description={
            filtering
              ? "Nenhuma produção combina com esses filtros."
              : "As produções da equipe aparecem aqui."
          }
        />
      ) : null}
      <ProductionBoard
        columns={board}
        canEdit={canEdit}
        canApprove={access.workspace.membership.role !== "MEMBER"}
      />
    </div>
  );
}
