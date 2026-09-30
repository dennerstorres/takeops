import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { ProjectForm } from "@/components/projects/project-form";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { NotFoundError } from "@/server/errors";
import { listIdeas } from "@/server/idea";
import { prismaIdeaRepository } from "@/server/idea-prisma";
import { getProject } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

function dateInput(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function EditProductionPage({
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
  if (access.workspace.membership.role === "VIEWER") {
    redirect(`/producoes/${id}`);
  }
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
  if (!project) redirect("/producoes");

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
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-frame px-3 py-2 text-frame-foreground">
        <div className="space-y-1">
          <h1 className="font-condensed text-xl font-semibold tracking-wider uppercase">
            {t("projects.edit")}
          </h1>
          <p className="text-sm text-frame-foreground/80">{project.title}</p>
        </div>
        {access.workspace.membership.role === "MEMBER" ? null : (
          <DeleteProjectButton projectId={project.id} />
        )}
      </header>
      <ProjectForm
        canEdit
        people={people.map((person) => ({
          id: person.userId,
          label: person.name ?? person.email ?? t("common.noName"),
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
        href={`/producoes/${project.id}`}
        className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
      >
        {t("projects.backToOverview")}
      </Link>
    </div>
  );
}
