import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProductionTabs } from "@/components/projects/production-tabs";
import { DeleteShootButton } from "@/components/shoots/delete-shoot-button";
import { InstantiateChecklistForm } from "@/components/shoots/instantiate-checklist-form";
import { ShootEquipment } from "@/components/shoots/shoot-equipment";
import { ShootForm } from "@/components/shoots/shoot-form";
import { buttonVariants } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { utcToZonedLocal } from "@/lib/zoned-time";
import { cn } from "@/lib/utils";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { listChecklistTemplates } from "@/server/checklist";
import { prismaChecklistRepository } from "@/server/checklist-prisma";
import { listEquipment } from "@/server/equipment";
import { equipmentCategoryLabel } from "@/server/equipment-labels";
import { prismaEquipmentRepository } from "@/server/equipment-prisma";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { listProjectChecklist } from "@/server/production-template";
import { prismaProductionTemplateRepository } from "@/server/production-template-prisma";
import { getProject } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { listShoots } from "@/server/shoot";
import { listShootChecklist } from "@/server/shoot-checklist";
import { prismaShootChecklistRepository } from "@/server/shoot-checklist-prisma";
import { PROJECT_CHECKLIST_SOURCE } from "@/server/shoot-checklist-repository";
import { listShootEquipment } from "@/server/shoot-equipment";
import { prismaShootEquipmentRepository } from "@/server/shoot-equipment-prisma";
import { shootStatusLabel } from "@/server/shoot-labels";
import { prismaShootRepository } from "@/server/shoot-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function ShootsPage({
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
  const timezone = access.workspace.workspace.timezone;
  const canEdit = access.workspace.membership.role !== "VIEWER";

  let project;
  let shoots;
  let kits;
  let catalog;
  let checklists;
  let templates;
  let projectChecklist;
  try {
    project = await getProject(
      session.user.id,
      workspaceId,
      id,
      prismaWorkspaceRepository,
      prismaProjectRepository,
    );
    const deps = {
      workspaces: prismaWorkspaceRepository,
      projects: prismaProjectRepository,
      shoots: prismaShootRepository,
      shootEquipment: prismaShootEquipmentRepository,
      shootChecklist: prismaShootChecklistRepository,
    };
    shoots = await listShoots(session.user.id, workspaceId, project.id, deps);
    const userId = session.user.id;
    const projectId = project.id;
    [kits, catalog, checklists, templates, projectChecklist] =
      await Promise.all([
        Promise.all(
          shoots.map((shoot) =>
            listShootEquipment(userId, workspaceId, projectId, shoot.id, deps),
          ),
        ),
        listEquipment(
          userId,
          workspaceId,
          prismaWorkspaceRepository,
          prismaEquipmentRepository,
        ),
        Promise.all(
          shoots.map((shoot) =>
            listShootChecklist(userId, workspaceId, projectId, shoot.id, deps),
          ),
        ),
        listChecklistTemplates(
          userId,
          workspaceId,
          prismaWorkspaceRepository,
          prismaChecklistRepository,
        ),
        listProjectChecklist(userId, workspaceId, projectId, {
          workspaces: prismaWorkspaceRepository,
          projects: prismaProjectRepository,
          templates: prismaProductionTemplateRepository,
        }),
      ]);
  } catch (error) {
    if (error instanceof NotFoundError) redirect("/producoes");
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  const catalogOptions = catalog
    .filter((item) => item.active)
    .map((item) => ({
      id: item.id,
      label: `${item.name} · ${equipmentCategoryLabel(t, item.category)}`,
    }));

  const templateOptions = [
    // O checklist copiado do template da produção vem primeiro.
    ...(projectChecklist.length > 0
      ? [
          {
            id: PROJECT_CHECKLIST_SOURCE,
            label: t("projects.productionChecklistCount", {
              count: projectChecklist.length,
            }),
          },
        ]
      : []),
    ...templates
      .filter((template) => template.items.length > 0)
      .map((template) => ({
        id: template.id,
        label: t("projects.templateItemCount", {
          name: template.name,
          count: template.items.length,
        }),
      })),
  ];

  const dateTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ProductionTabs projectId={project.id} active="Gravação" />
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">
          {t("tabs.recording")}
        </h1>
        <p className="text-sm text-muted-foreground">{project.title}</p>
      </header>
      {projectChecklist.length > 0 ? (
        <details className={cn(surfaceClass, "p-3")}>
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium">
            {t("projects.productionChecklistCount", {
              count: projectChecklist.length,
            })}
          </summary>
          <p className="text-sm text-muted-foreground">
            {t("projects.checklistFromTemplate")}
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {projectChecklist.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ol>
        </details>
      ) : null}
      <Link
        href={`/producoes/${project.id}/continuidade`}
        className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
      >
        {t("continuity.title")}
      </Link>
      {shoots.length === 0 ? (
        <EmptyState
          title={t("record.emptyScheduled")}
          description={t("record.emptyScheduledDescription")}
        />
      ) : (
        <ol className="flex flex-col gap-3">
          {shoots.map((shoot, index) => (
            <li key={shoot.id} className={cn(surfaceClass, "p-3")}>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">
                  {shoot.title || t("record.session")}
                </p>
                <p className="text-sm">
                  <time dateTime={shoot.scheduledAt.toISOString()}>
                    {dateTime.format(shoot.scheduledAt)}
                  </time>
                  {shoot.endAt ? (
                    <>
                      {" – "}
                      <time dateTime={shoot.endAt.toISOString()}>
                        {time.format(shoot.endAt)}
                      </time>
                    </>
                  ) : null}
                </p>
                <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <StatusBadge status={shoot.status}>
                    {shootStatusLabel(t, shoot.status)}
                  </StatusBadge>
                  {shoot.location ? <span>{shoot.location}</span> : null}
                </p>
                {shoot.notes ? (
                  <p className="text-sm whitespace-pre-wrap">{shoot.notes}</p>
                ) : null}
              </div>
              <Link
                href={`/producoes/${project.id}/gravacao/${shoot.id}/modo`}
                className={cn(buttonVariants(), "mt-3 w-full")}
              >
                {t("record.open")}
              </Link>
              <div className="mt-3 border-t pt-3">
                <ShootEquipment
                  projectId={project.id}
                  shootId={shoot.id}
                  rows={kits[index]}
                  catalog={catalogOptions}
                  canEdit={canEdit}
                />
              </div>
              <section className="mt-3 space-y-2 border-t pt-3">
                <h3 className="text-sm font-medium">
                  {t("record.checklist")}
                  {checklists[index].length > 0 ? (
                    <span className="font-normal text-muted-foreground">
                      {t("record.checklistProgress", {
                        done: checklists[index].filter((item) => item.completed)
                          .length,
                        total: checklists[index].length,
                      })}
                    </span>
                  ) : null}
                </h3>
                {checklists[index].length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("record.noChecklist")}
                  </p>
                ) : (
                  <Link
                    href={`/producoes/${project.id}/gravacao/${shoot.id}/checklist`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    {t("record.openChecklist")}
                  </Link>
                )}
                {canEdit && templateOptions.length > 0 ? (
                  <InstantiateChecklistForm
                    projectId={project.id}
                    shootId={shoot.id}
                    templates={templateOptions}
                  />
                ) : null}
              </section>
              {canEdit ? (
                <div className="mt-3 space-y-3">
                  <DeleteShootButton
                    projectId={project.id}
                    shootId={shoot.id}
                  />
                  <details>
                    <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm">
                      {t("record.edit")}
                    </summary>
                    <div className="pt-3">
                      <ShootForm
                        timezone={timezone}
                        values={{
                          projectId: project.id,
                          shootId: shoot.id,
                          title: shoot.title ?? "",
                          scheduledAt: utcToZonedLocal(
                            shoot.scheduledAt,
                            timezone,
                          ),
                          endAt: shoot.endAt
                            ? utcToZonedLocal(shoot.endAt, timezone)
                            : "",
                          location: shoot.location ?? "",
                          notes: shoot.notes ?? "",
                          status: shoot.status,
                        }}
                      />
                    </div>
                  </details>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      {canEdit ? (
        <section className="space-y-3">
          <h2 className="text-base font-medium">{t("record.schedule")}</h2>
          <ShootForm
            timezone={timezone}
            values={{
              projectId: project.id,
              title: "",
              scheduledAt: "",
              endAt: "",
              location: "",
              notes: "",
              status: "PLANNED",
            }}
          />
        </section>
      ) : null}
    </div>
  );
}
