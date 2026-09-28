import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteIdeaButton } from "@/components/ideas/delete-idea-button";
import { IdeaForm } from "@/components/ideas/idea-form";
import { IdeaStatusForm } from "@/components/ideas/idea-status-form";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { NotFoundError } from "@/server/errors";
import { getIdea } from "@/server/idea";
import { prismaIdeaRepository } from "@/server/idea-prisma";
import { statusLabel } from "@/server/idea-labels";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function IdeaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <h1 className="text-2xl font-medium tracking-tight">Ideia</h1>
        <p className="text-sm text-muted-foreground">
          Esta ideia não está na lista.
        </p>
        <Link
          href="/ideias"
          className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
        >
          Voltar para a lista
        </Link>
      </div>
    );
  }

  const canEdit = access.workspace.membership.role !== "VIEWER";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">{idea.title}</h1>
          <p className="text-sm text-muted-foreground">
            {statusLabel(idea.status)} · {idea.authorName ?? "Sem nome"}
          </p>
          {canEdit && idea.status !== "CONVERTED" ? (
            <IdeaStatusForm ideaId={idea.id} status={idea.status} />
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
        Voltar para a lista
      </Link>
    </div>
  );
}
