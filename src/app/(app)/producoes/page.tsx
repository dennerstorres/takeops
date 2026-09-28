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
import {
  hasProjectSearch,
  parseProjectSearch,
} from "@/server/project-search";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

const fieldClass =
  "w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function personLabel(member: { name: string | null; email: string | null }) {
  return member.name || member.email || "Sem nome";
}

export default async function ProductionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
    board = buildProjectBoard(projects, participants, team);
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
          <input
            name="q"
            defaultValue={query.text}
            placeholder="Título"
            className={`${fieldClass} h-11`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select
            name="status"
            defaultValue={query.status}
            className={`${fieldClass} h-11`}
          >
            <option value="">Todos</option>
            {videoProjectStatuses.map((status) => (
              <option key={status} value={status}>
                {projectStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Prioridade
          <select
            name="priority"
            defaultValue={query.priority}
            className={`${fieldClass} h-11`}
          >
            <option value="">Todas</option>
            {projectPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priorityLabel(priority)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Responsável
          <select
            name="ownerId"
            defaultValue={query.ownerId}
            className={`${fieldClass} h-11`}
          >
            <option value="">Todos</option>
            {team.map((member) => (
              <option key={member.userId} value={member.userId}>
                {personLabel(member)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Participante
          <select
            name="participantId"
            defaultValue={query.participantId}
            className={`${fieldClass} h-11`}
          >
            <option value="">Todos</option>
            {team.map((member) => (
              <option key={member.userId} value={member.userId}>
                {personLabel(member)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Produto
          <input
            name="product"
            defaultValue={query.product}
            className={`${fieldClass} h-11`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Gravação de
          <input
            type="date"
            name="shootFrom"
            defaultValue={query.shootFrom}
            className={`${fieldClass} h-11`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Gravação até
          <input
            type="date"
            name="shootTo"
            defaultValue={query.shootTo}
            className={`${fieldClass} h-11`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Publicação de
          <input
            type="date"
            name="publishFrom"
            defaultValue={query.publishFrom}
            className={`${fieldClass} h-11`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Publicação até
          <input
            type="date"
            name="publishTo"
            defaultValue={query.publishTo}
            className={`${fieldClass} h-11`}
          />
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
      <ProductionBoard columns={board} canEdit={canEdit} />
    </div>
  );
}
