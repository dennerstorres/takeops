import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { ItemList, ItemListRow } from "@/components/ui/item-list";
import { StatusBadge } from "@/components/ui/status-badge";
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

  const when = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: workspace.timezone,
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">Ideias</h1>
          <p className="text-sm text-muted-foreground">
            Ideias de {workspace.name}.
          </p>
        </div>
        {canEdit ? (
          <Link
            href="/ideias/nova"
            className={buttonVariants({ variant: "outline" })}
          >
            Completar campos
          </Link>
        ) : null}
      </header>
      {canEdit ? <CaptureIdeaForm /> : null}
      {ideas.length === 0 ? (
        <EmptyState
          title="Nenhuma ideia"
          description="As ideias da equipe aparecem aqui."
        />
      ) : (
        <ItemList>
          {ideas.map((idea) => (
            <ItemListRow key={idea.id} className="p-0">
              <Link
                href={`/ideias/${idea.id}`}
                className="flex min-h-11 w-full flex-col gap-1 px-4 py-3 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="truncate text-sm font-medium">
                  {idea.title}
                </span>
                <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <StatusBadge status={idea.status}>
                    {statusLabel(t, idea.status)}
                  </StatusBadge>
                  {when.format(idea.createdAt)}
                </span>
              </Link>
            </ItemListRow>
          ))}
        </ItemList>
      )}
    </div>
  );
}
