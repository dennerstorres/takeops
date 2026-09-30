import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ProductionTabs } from "@/components/projects/production-tabs";
import { ScriptImportForm } from "@/components/script/script-import-form";
import { buttonVariants } from "@/components/ui/button";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { getProject } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function ScriptImportPage({
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
  const canEdit = access.workspace.membership.role !== "VIEWER";

  let project;
  try {
    project = await getProject(
      session.user.id,
      access.workspace.workspace.id,
      id,
      prismaWorkspaceRepository,
      prismaProjectRepository,
    );
  } catch (error) {
    if (error instanceof NotFoundError) redirect("/producoes");
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }
  if (!canEdit) redirect(`/producoes/${project.id}/roteiro`);

  return (
    <div className="flex w-full flex-col gap-4">
      <ProductionTabs project={project} active="Roteiro" canEdit={canEdit} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="grid gap-1">
          <h1 className="font-condensed text-sm font-semibold tracking-wider uppercase">
            {t("scriptImport.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("scriptImport.intro")}
          </p>
        </div>
        <a
          href={`/producoes/${project.id}/roteiro/modelo`}
          download
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("script.downloadTemplate")}
        </a>
      </div>
      <ScriptImportForm projectId={project.id} />
    </div>
  );
}
