import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ContinuityForm } from "@/components/continuity/continuity-form";
import { DeleteContinuityButton } from "@/components/continuity/delete-continuity-button";
import { EmptyState } from "@/components/feedback/empty-state";
import { surfaceClass } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { groupContinuityNotes, listContinuityNotes } from "@/server/continuity";
import { prismaContinuityRepository } from "@/server/continuity-prisma";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { getProject } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function ContinuityPage({
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
  const canEdit = access.workspace.membership.role !== "VIEWER";

  let project;
  let notes;
  try {
    project = await getProject(
      session.user.id,
      workspaceId,
      id,
      prismaWorkspaceRepository,
      prismaProjectRepository,
    );
    notes = await listContinuityNotes(
      session.user.id,
      workspaceId,
      project.id,
      {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        continuity: prismaContinuityRepository,
      },
    );
  } catch (error) {
    if (error instanceof NotFoundError) redirect("/producoes");
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  const groups = groupContinuityNotes(notes);
  const categories = groups
    .map((group) => group.category)
    .filter((category): category is string => Boolean(category));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href={`/producoes/${project.id}/gravacao`}
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("record.back")}
      </Link>
      <header className="flex flex-col gap-0.5 rounded-md bg-frame px-3 py-2 text-frame-foreground">
        <h1 className="font-condensed text-xl font-semibold tracking-wider uppercase">
          {t("continuity.title")}
        </h1>
        <p className="text-sm text-frame-foreground/80">{project.title}</p>
      </header>
      {canEdit ? (
        <section className={cn(surfaceClass, "space-y-3 p-3")}>
          <h2 className="text-sm font-medium">{t("continuity.new")}</h2>
          <ContinuityForm
            categories={categories}
            values={{
              projectId: project.id,
              category: "",
              title: "",
              description: "",
            }}
          />
        </section>
      ) : null}
      {groups.length === 0 ? (
        <EmptyState
          title={t("continuity.emptyTitle")}
          description={t("continuity.emptyDescription")}
        />
      ) : (
        groups.map((group) => (
          <section key={group.category ?? ""} className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              {group.category ?? t("continuity.uncategorized")}
            </h2>
            <ul className="flex flex-col gap-3">
              {group.items.map((note) => (
                <li key={note.id} className={cn(surfaceClass, "p-3")}>
                  <p className="text-sm font-medium">{note.title}</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {note.description}
                  </p>
                  {canEdit ? (
                    <details className="mt-3 border-t pt-3">
                      <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm">
                        {t("common.edit")}
                      </summary>
                      <div className="mt-2 space-y-3">
                        <ContinuityForm
                          categories={categories}
                          values={{
                            projectId: project.id,
                            noteId: note.id,
                            category: note.category ?? "",
                            title: note.title,
                            description: note.description,
                          }}
                        />
                        <DeleteContinuityButton
                          projectId={project.id}
                          noteId={note.id}
                        />
                      </div>
                    </details>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
