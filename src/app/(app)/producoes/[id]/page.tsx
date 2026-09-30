import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ParticipantForm,
  RemoveParticipantButton,
} from "@/components/projects/participant-form";
import { ProductionTabs } from "@/components/projects/production-tabs";
import { buttonVariants } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { ItemList, ItemListRow } from "@/components/ui/item-list";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
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
  const t = await getTranslations();
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
        <h1 className="text-2xl font-medium tracking-tight">
          {t("projects.one")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("projects.missing")}</p>
        <Link
          href="/producoes"
          className={buttonVariants({ variant: "outline" })}
        >
          {t("projects.backToList")}
        </Link>
      </div>
    );
  }

  const canEdit = access.workspace.membership.role !== "VIEWER";
  // Só dono e admin definem quem aprova (ADR-035).
  const canManageApprovers = ["OWNER", "ADMIN"].includes(
    access.workspace.membership.role,
  );
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
    ownerName: owner ? (owner.name ?? owner.email ?? t("common.noName")) : null,
    participants,
    t,
  });
  const facts = [
    ["objective", t("projects.objective"), overview.objective],
    ["product", t("projects.product"), overview.product],
    ["audience", t("projects.audience"), overview.audience],
    ["format", t("projects.format"), overview.format],
    ["aspect", t("projects.aspectRatio"), overview.aspectRatio],
    ["duration", t("projects.duration"), overview.duration],
    ["status", t("common.status"), overview.status],
    ["priority", t("projects.priority"), overview.priority],
    ["shoot", t("tabs.recording"), overview.shootDate],
    ["publish", t("tabs.publication"), overview.publishDate],
    ["owner", t("projects.owner"), overview.ownerName],
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">
            {overview.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("projects.progress", { progress: overview.progress })}
          </p>
        </div>
        {canEdit ? (
          <Link
            href={`/producoes/${project.id}/editar`}
            className={buttonVariants({ variant: "outline" })}
          >
            {t("common.edit")}
          </Link>
        ) : null}
      </header>
      <ProductionTabs projectId={project.id} />
      <dl className="grid gap-3 sm:grid-cols-2">
        {facts.map(([id, label, value]) => (
          <div key={id} className={cn(surfaceClass, "p-3")}>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium">
              {id === "status" ? (
                <StatusBadge status={project.status}>
                  {value ?? t("common.notSet")}
                </StatusBadge>
              ) : (
                (value ?? t("common.notSet"))
              )}
            </dd>
          </div>
        ))}
      </dl>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">{t("projects.links")}</h2>
        <Link
          href={`/producoes/${project.id}/arquivos`}
          className={buttonVariants({ variant: "outline" })}
        >
          {t("assets.title")}
        </Link>
        {overview.links.length === 0 ? null : (
          <ul className="flex flex-col gap-2">
            {overview.links.map((link) => (
              <li key={link.href}>
                {link.href.startsWith("/") ? (
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
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
        <h2 className="text-lg font-medium">{t("projects.participants")}</h2>
        {overview.participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("projects.noParticipants")}
          </p>
        ) : (
          <ItemList>
            {participants.map((person) => (
              <ItemListRow key={person.id} className="flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {person.name ?? person.email ?? t("common.noName")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <StatusBadge tone="muted">
                      {projectRoleLabel(t, person.role)}
                    </StatusBadge>
                  </p>
                </div>
                {canEdit &&
                (person.role !== "APPROVER" || canManageApprovers) ? (
                  <RemoveParticipantButton
                    projectId={project.id}
                    userId={person.userId}
                    role={person.role}
                  />
                ) : null}
              </ItemListRow>
            ))}
          </ItemList>
        )}
        {canEdit ? (
          <ParticipantForm
            canManageApprovers={canManageApprovers}
            projectId={project.id}
            people={people.map((person) => ({
              id: person.userId,
              label: person.name ?? person.email ?? t("common.noName"),
            }))}
          />
        ) : null}
      </section>
      <Link
        href="/producoes"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("projects.backToList")}
      </Link>
    </div>
  );
}
