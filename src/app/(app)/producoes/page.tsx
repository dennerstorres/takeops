import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">
            {t("projects.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("projects.ofWorkspace", { name: workspace.name })}
          </p>
        </div>
        {canEdit ? (
          <Link href="/producoes/nova" className={buttonVariants()}>
            {t("projects.create")}
          </Link>
        ) : null}
      </header>
      <Card>
        <form
          method="get"
          className="grid gap-3 sm:grid-cols-2"
          aria-label={t("projects.filters")}
        >
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            {t("projects.search")}
            <Input
              name="q"
              defaultValue={query.text}
              placeholder={t("common.title")}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
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
          <label className="flex flex-col gap-1 text-sm">
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
          <label className="flex flex-col gap-1 text-sm">
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
          <label className="flex flex-col gap-1 text-sm">
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
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            {t("projects.product")}
            <Input name="product" defaultValue={query.product} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("projects.shootFrom")}
            <Input
              type="date"
              name="shootFrom"
              defaultValue={query.shootFrom}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("projects.shootTo")}
            <Input type="date" name="shootTo" defaultValue={query.shootTo} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("projects.publishFrom")}
            <Input
              type="date"
              name="publishFrom"
              defaultValue={query.publishFrom}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("projects.publishTo")}
            <Input
              type="date"
              name="publishTo"
              defaultValue={query.publishTo}
            />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit">{t("projects.filter")}</Button>
            <Link
              href="/producoes"
              className={buttonVariants({ variant: "outline" })}
            >
              {t("projects.clear")}
            </Link>
          </div>
        </form>
      </Card>
      {projects.length === 0 ? (
        <EmptyState
          title={filtering ? t("projects.noneFound") : t("projects.emptyTitle")}
          description={
            filtering ? t("projects.noneMatch") : t("projects.emptyDescription")
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
