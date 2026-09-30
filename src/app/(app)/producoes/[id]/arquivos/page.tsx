import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AssetForm } from "@/components/assets/asset-form";
import { DeleteAssetButton } from "@/components/assets/delete-asset-button";
import { EmptyState } from "@/components/feedback/empty-state";
import { surfaceClass } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { openWorkspace } from "@/server/access";
import { listAssets } from "@/server/asset";
import { assetTypeLabel } from "@/server/asset-labels";
import { prismaAssetRepository } from "@/server/asset-prisma";
import { auth } from "@/server/auth";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { getProject } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function AssetsPage({
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
  let assets;
  try {
    project = await getProject(
      session.user.id,
      workspaceId,
      id,
      prismaWorkspaceRepository,
      prismaProjectRepository,
    );
    assets = await listAssets(session.user.id, workspaceId, project.id, {
      workspaces: prismaWorkspaceRepository,
      projects: prismaProjectRepository,
      assets: prismaAssetRepository,
    });
  } catch (error) {
    if (error instanceof NotFoundError) redirect("/producoes");
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href={`/producoes/${project.id}`}
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("projects.backToProduction")}
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">
          {t("assets.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("assets.intro", { title: project.title })}
        </p>
      </header>
      {canEdit ? (
        <section className={cn(surfaceClass, "space-y-3 p-3")}>
          <h2 className="text-sm font-medium">{t("assets.newLink")}</h2>
          <AssetForm
            values={{
              projectId: project.id,
              type: "RAW_FOOTAGE",
              title: "",
              url: "",
              description: "",
            }}
          />
        </section>
      ) : null}
      {assets.length === 0 ? (
        <EmptyState
          title={t("assets.emptyTitle")}
          description={t("assets.emptyDescription")}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {assets.map((asset) => (
            <li key={asset.id} className={cn(surfaceClass, "p-3")}>
              <p>
                <StatusBadge tone="muted">
                  {assetTypeLabel(t, asset.type)}
                </StatusBadge>
              </p>
              <a
                href={asset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-sm font-medium break-all text-primary underline-offset-4 hover:underline"
              >
                {asset.title}
              </a>
              {asset.description ? (
                <p className="text-sm whitespace-pre-wrap">
                  {asset.description}
                </p>
              ) : null}
              {canEdit ? (
                <details className="mt-3 border-t pt-3">
                  <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm">
                    {t("common.edit")}
                  </summary>
                  <div className="mt-2 space-y-3">
                    <AssetForm
                      values={{
                        projectId: project.id,
                        assetId: asset.id,
                        type: asset.type,
                        title: asset.title,
                        url: asset.url,
                        description: asset.description ?? "",
                      }}
                    />
                    <DeleteAssetButton
                      projectId={project.id}
                      assetId={asset.id}
                    />
                  </div>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
