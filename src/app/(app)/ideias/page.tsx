import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Strip, StripBoard } from "@/components/ui/strip";
import { ideaPhase } from "@/components/ui/strip-phase";
import { cn } from "@/lib/utils";
import { CaptureIdeaForm } from "@/components/ideas/capture-idea-form";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ForbiddenError } from "@/server/errors";
import { listIdeas } from "@/server/idea";
import { prismaIdeaRepository } from "@/server/idea-prisma";
import { statusLabel } from "@/server/idea-labels";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function IdeasPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");

  const workspace = access.workspace.workspace;
  const canEdit = access.workspace.membership.role !== "VIEWER";
  let ideas;
  try {
    ideas = await listIdeas(
      session.user.id,
      workspace.id,
      prismaWorkspaceRepository,
      prismaIdeaRepository,
    );
  } catch (error) {
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  const when = new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeZone: workspace.timezone,
  });

  return (
    <div className="flex w-full flex-col gap-3">
      <header className="flex flex-wrap items-center gap-2 rounded-md bg-frame p-1.5 text-frame-foreground">
        <h1 className="flex items-baseline gap-2 px-1.5 font-condensed text-lg font-semibold tracking-wider uppercase">
          {t("ideas.title")}
          <span className="text-sm font-medium tabular-nums">
            {ideas.length}
          </span>
        </h1>
        {canEdit ? (
          <>
            <div className="order-last min-w-0 basis-full sm:order-none sm:flex-1 sm:basis-auto">
              <CaptureIdeaForm />
            </div>
            <Link
              href="/ideias/nova"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "ml-auto h-11 bg-card sm:ml-0 sm:h-8",
              )}
            >
              {t("ideas.fillIn")}
            </Link>
          </>
        ) : null}
      </header>
      {ideas.length === 0 ? (
        <EmptyState
          title={t("ideas.emptyTitle")}
          description={t("ideas.emptyDescription")}
        />
      ) : (
        <StripBoard
          label={t("ideas.title")}
          columns={{
            number: "",
            title: t("ideas.titleField"),
            owner: t("ideas.author"),
            date: t("ideas.created"),
            meta: t("ideas.status"),
          }}
        >
          {ideas.map((idea) => (
            <Strip
              key={idea.id}
              phase={ideaPhase(idea.status)}
              stageLabel={statusLabel(t, idea.status)}
              title={idea.title}
              owner={idea.authorName}
              date={when.format(idea.createdAt)}
              meta={statusLabel(t, idea.status)}
              tip={idea.status === "DISCARDED" ? "idle" : "ok"}
              href={`/ideias/${idea.id}`}
            />
          ))}
        </StripBoard>
      )}
    </div>
  );
}
