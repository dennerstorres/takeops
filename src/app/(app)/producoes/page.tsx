import { getTranslations } from "next-intl/server";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProductionBoard } from "@/components/projects/production-board";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ForbiddenError } from "@/server/errors";
import { prismaParticipantRepository } from "@/server/participant-prisma";
import { buildProjectBoard } from "@/server/project-board";
import { loadBoardStats } from "@/server/project-board-prisma";
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
import { cn } from "@/lib/utils";

function personLabel(
  member: { name: string | null; email: string | null },
  fallback: string,
) {
  return member.name || member.email || fallback;
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
    const ids = projects.map((project) => project.id);
    const [participants, stats] = await Promise.all([
      prismaParticipantRepository.listByProjectIds(ids),
      loadBoardStats(workspace.id, ids),
    ]);
    board = buildProjectBoard(projects, participants, team, t, stats);
  } catch (error) {
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  const filtering = hasProjectSearch(query);
  // A busca por texto fica sempre à vista; os demais filtros abrem num
  // painel e o contador diz quantos estão ligados.
  const extraFilters = Object.entries(query).filter(
    ([key, value]) => key !== "text" && value !== "",
  ).length;
  const filterLabel = "flex flex-col gap-1 text-sm";
  const barControl = "h-11 sm:h-8";

  return (
    <div className="flex w-full flex-col gap-3">
      <form
        method="get"
        aria-label={t("projects.filters")}
        className="relative flex flex-wrap items-center gap-2 rounded-md bg-frame p-1.5 text-frame-foreground"
      >
        <h1 className="order-1 flex items-baseline sm:order-first gap-2 px-1.5 font-condensed text-lg font-semibold tracking-wider uppercase">
          {t("projects.title")}
          <span className="text-sm font-medium tabular-nums">
            {projects.length}
          </span>
        </h1>
        {/* No celular a busca desce para a segunda linha da barra. */}
        <span aria-hidden="true" className="order-3 basis-full sm:hidden" />
        <label className="order-4 min-w-0 flex-1 sm:order-none sm:max-w-72">
          <span className="sr-only">{t("projects.search")}</span>
          <span className="flex">
            <Input
              type="search"
              name="q"
              defaultValue={query.text}
              placeholder={t("projects.board.searchPlaceholder")}
              className={cn(barControl, "rounded-r-none bg-card")}
            />
            <button
              type="submit"
              aria-label={t("projects.filter")}
              title={t("projects.filter")}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-r-md border border-l-0 border-input bg-card text-card-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring sm:size-8"
            >
              <Search className="size-4" aria-hidden="true" />
            </button>
          </span>
        </label>
        <details className="order-5 sm:order-none">
          <summary
            className={cn(
              buttonVariants({ variant: "outline" }),
              barControl,
              "cursor-pointer list-none bg-card [&::-webkit-details-marker]:hidden",
            )}
          >
            <SlidersHorizontal aria-hidden="true" />
            {t("projects.board.moreFilters")}
            {extraFilters > 0 ? (
              <span className="rounded-[2px] bg-divider px-1.5 text-xs leading-5 text-divider-foreground tabular-nums">
                {extraFilters}
              </span>
            ) : null}
          </summary>
          <div className="absolute inset-x-0 top-full z-20 mt-1 grid gap-3 rounded-md border bg-popover p-3 text-popover-foreground shadow-md sm:grid-cols-2 lg:grid-cols-4">
            <label className={filterLabel}>
              {t("common.status")}
              <Select name="status" defaultValue={query.status}>
                <option value="">{t("projects.all")}</option>
                {videoProjectStatuses.map((status) => (
                  <option key={status} value={status}>
                    {projectStatusLabel(t, status)}
                  </option>
                ))}
              </Select>
            </label>
            <label className={filterLabel}>
              {t("projects.priority")}
              <Select name="priority" defaultValue={query.priority}>
                <option value="">{t("projects.allFeminine")}</option>
                {projectPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priorityLabel(t, priority)}
                  </option>
                ))}
              </Select>
            </label>
            <label className={filterLabel}>
              {t("projects.owner")}
              <Select name="ownerId" defaultValue={query.ownerId}>
                <option value="">{t("projects.all")}</option>
                {team.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {personLabel(member, t("common.noName"))}
                  </option>
                ))}
              </Select>
            </label>
            <label className={filterLabel}>
              {t("projects.participant")}
              <Select name="participantId" defaultValue={query.participantId}>
                <option value="">{t("projects.all")}</option>
                {team.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {personLabel(member, t("common.noName"))}
                  </option>
                ))}
              </Select>
            </label>
            <label className={filterLabel}>
              {t("projects.product")}
              <Input name="product" defaultValue={query.product} />
            </label>
            <label className={filterLabel}>
              {t("projects.shootFrom")}
              <Input
                type="date"
                name="shootFrom"
                defaultValue={query.shootFrom}
              />
            </label>
            <label className={filterLabel}>
              {t("projects.shootTo")}
              <Input type="date" name="shootTo" defaultValue={query.shootTo} />
            </label>
            <label className={filterLabel}>
              {t("projects.publishFrom")}
              <Input
                type="date"
                name="publishFrom"
                defaultValue={query.publishFrom}
              />
            </label>
            <label className={filterLabel}>
              {t("projects.publishTo")}
              <Input
                type="date"
                name="publishTo"
                defaultValue={query.publishTo}
              />
            </label>
            <div className="flex items-end sm:col-span-2 lg:col-span-4">
              <Button type="submit">{t("projects.filter")}</Button>
            </div>
          </div>
        </details>
        {filtering ? (
          <Link
            href="/producoes"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              barControl,
              "order-7 sm:order-none",
            )}
          >
            {t("projects.clear")}
          </Link>
        ) : null}
        {canEdit ? (
          <Link
            href="/producoes/nova"
            className={cn(
              buttonVariants(),
              barControl,
              "order-2 ml-auto sm:order-last",
            )}
          >
            <Plus aria-hidden="true" />
            {t("projects.create")}
          </Link>
        ) : null}
      </form>
      {projects.length === 0 ? (
        <EmptyState
          title={filtering ? t("projects.noneFound") : t("projects.emptyTitle")}
          description={
            filtering ? t("projects.noneMatch") : t("projects.emptyDescription")
          }
        />
      ) : (
        <ProductionBoard
          columns={board}
          canEdit={canEdit}
          canApprove={access.workspace.membership.role !== "MEMBER"}
          hideEmpty={filtering}
        />
      )}
    </div>
  );
}
