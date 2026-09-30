import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { listIdeas } from "@/server/idea";
import { listProductionTemplates } from "@/server/production-template";
import { prismaProductionTemplateRepository } from "@/server/production-template-prisma";
import { prismaIdeaRepository } from "@/server/idea-prisma";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function NewProductionPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string | string[] }>;
}) {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  if (access.workspace.membership.role === "VIEWER") redirect("/producoes");

  const workspaceId = access.workspace.workspace.id;
  const [people, ideas, templates] = await Promise.all([
    listTeam(session.user.id, workspaceId, prismaWorkspaceRepository),
    listIdeas(
      session.user.id,
      workspaceId,
      prismaWorkspaceRepository,
      prismaIdeaRepository,
    ),
    listProductionTemplates(session.user.id, workspaceId, {
      workspaces: prismaWorkspaceRepository,
      templates: prismaProductionTemplateRepository,
    }),
  ]);
  const { template: chosenId } = await searchParams;
  // Template de outro workspace ou inexistente simplesmente não é escolhido.
  const chosen = templates.find((template) => template.id === chosenId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">
          {t("projects.create")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("projects.startsAsIdea")}
        </p>
      </header>
      {templates.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">{t("projects.fromTemplate")}</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/producoes/nova"
              aria-current={chosen ? undefined : "page"}
              className={`inline-flex min-h-11 items-center rounded-lg border px-3 text-sm ${
                chosen ? "" : "bg-muted font-medium"
              }`}
            >
              {t("projects.blank")}
            </Link>
            {templates.map((template) => (
              <Link
                key={template.id}
                href={`/producoes/nova?template=${template.id}`}
                aria-current={chosen?.id === template.id ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-lg border px-3 text-sm ${
                  chosen?.id === template.id ? "bg-muted font-medium" : ""
                }`}
              >
                {template.name}
              </Link>
            ))}
          </div>
          {chosen ? (
            <p className="text-sm text-muted-foreground">
              {t("projects.templateCopy", { name: chosen.name })}
            </p>
          ) : null}
        </section>
      ) : null}
      <ProjectForm
        templateId={chosen?.id}
        canEdit
        people={people.map((person) => ({
          id: person.userId,
          label: person.name ?? person.email ?? t("common.noName"),
        }))}
        ideas={ideas.map((idea) => ({ id: idea.id, label: idea.title }))}
        values={{
          title: "",
          slug: "",
          description: "",
          objective: "",
          audience: "",
          product: "",
          format: "TUTORIAL",
          aspectRatio: "NINE_SIXTEEN",
          estimatedDurationSeconds: "",
          priority: "NORMAL",
          thumbnailUrl: "",
          ownerId: "",
          plannedShootDate: "",
          plannedPublishDate: "",
          sourceIdeaId: "",
        }}
      />
    </div>
  );
}
