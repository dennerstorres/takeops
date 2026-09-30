import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConvertIdeaButton } from "@/components/ideas/convert-idea-button";
import { DeleteIdeaButton } from "@/components/ideas/delete-idea-button";
import { IdeaForm } from "@/components/ideas/idea-form";
import { IdeaStatusForm } from "@/components/ideas/idea-status-form";
import { stripPhaseClass } from "@/components/ui/strip";
import { ideaPhase } from "@/components/ui/strip-phase";
import { cn } from "@/lib/utils";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { NotFoundError } from "@/server/errors";
import { getIdea } from "@/server/idea";
import { projectFromIdea } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { prismaIdeaRepository } from "@/server/idea-prisma";
import { statusLabel } from "@/server/idea-labels";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function IdeaPage({
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

  let idea;
  try {
    idea = await getIdea(
      session.user.id,
      access.workspace.workspace.id,
      id,
      prismaWorkspaceRepository,
      prismaIdeaRepository,
    );
  } catch (error) {
    if (!(error instanceof NotFoundError)) throw error;
    idea = null;
  }

  if (!idea) {
    return (
      <div className="flex w-full flex-col gap-3">
        <h1 className="font-condensed text-xl font-semibold tracking-wider uppercase">
          {t("ideas.missingTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("ideas.missingDescription")}
        </p>
        <Link
          href="/ideias"
          className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
        >
          {t("ideas.backToList")}
        </Link>
      </div>
    );
  }

  const canEdit = access.workspace.membership.role !== "VIEWER";
  const workspaceId = access.workspace.workspace.id;
  const production =
    idea.status === "CONVERTED"
      ? await projectFromIdea(
          session.user.id,
          workspaceId,
          idea.id,
          prismaWorkspaceRepository,
          prismaProjectRepository,
        )
      : null;

  return (
    <div className="flex w-full flex-col gap-6">
      {/* A ideia aberta é a tira ampliada, na cartolina do status. */}
      <header
        className={cn(
          "flex flex-wrap items-start justify-between gap-3 rounded-md p-3 text-strip-ink",
          stripPhaseClass[ideaPhase(idea.status)],
        )}
      >
        <div className="space-y-1">
          <h1 className="font-condensed text-xl font-semibold tracking-wider uppercase">
            {idea.title}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-strip-ink-muted">
            <StatusBadge status={idea.status}>
              {statusLabel(t, idea.status)}
            </StatusBadge>
            {idea.authorName ?? t("common.noName")}
          </p>
          {canEdit && idea.status !== "CONVERTED" ? (
            <IdeaStatusForm ideaId={idea.id} status={idea.status} />
          ) : null}
          {canEdit && idea.status !== "CONVERTED" ? (
            <ConvertIdeaButton ideaId={idea.id} />
          ) : null}
          {production ? (
            <Link
              href={`/producoes/${production.id}`}
              className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
            >
              {t("ideas.viewProduction")}
            </Link>
          ) : null}
        </div>
        {canEdit ? <DeleteIdeaButton ideaId={idea.id} /> : null}
      </header>
      <IdeaForm
        canEdit={canEdit}
        values={{
          id: idea.id,
          title: idea.title,
          description: idea.description ?? "",
          format: idea.format ?? "",
          objective: idea.objective ?? "",
          product: idea.product ?? "",
          audience: idea.audience ?? "",
          referenceUrl: idea.referenceUrl ?? "",
          notes: idea.notes ?? "",
        }}
      />
      <Link
        href="/ideias"
        className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
      >
        {t("ideas.backToList")}
      </Link>
    </div>
  );
}
