import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProductionTabs } from "@/components/projects/production-tabs";
import { ReviewCommentForm } from "@/components/review/review-comment-form";
import { formatTimestamp } from "@/lib/timestamp";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { listEditVersions, versionLabel } from "@/server/edit-version";
import { prismaEditVersionRepository } from "@/server/edit-version-prisma";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { getProject } from "@/server/project";
import { prismaProjectRepository } from "@/server/project-prisma";
import { listReviewComments } from "@/server/review";
import { resolveReviewCommentAction } from "@/server/review-actions";
import { prismaReviewRepository } from "@/server/review-prisma";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

function personLabel(member: { name: string | null; email: string | null }) {
  return member.name || member.email || "Sem nome";
}

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ versao?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const { id } = await params;
  const { versao } = await searchParams;
  const workspaceId = access.workspace.workspace.id;
  const timezone = access.workspace.workspace.timezone;
  const canEdit = access.workspace.membership.role !== "VIEWER";
  const deps = {
    workspaces: prismaWorkspaceRepository,
    projects: prismaProjectRepository,
    versions: prismaEditVersionRepository,
    reviews: prismaReviewRepository,
  };

  let project;
  let versions;
  let team;
  try {
    project = await getProject(
      session.user.id,
      workspaceId,
      id,
      deps.workspaces,
      deps.projects,
    );
    [versions, team] = await Promise.all([
      listEditVersions(session.user.id, workspaceId, project.id, deps),
      listTeam(session.user.id, workspaceId, deps.workspaces),
    ]);
  } catch (error) {
    if (error instanceof NotFoundError) redirect("/producoes");
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  // Sem escolha na URL, a revisão abre na versão mais nova. Versão que não
  // é desta produção cai na mais nova em vez de dar erro.
  const current =
    versions.find((version) => version.id === versao) ?? versions[0] ?? null;
  const comments = current
    ? await listReviewComments(
        session.user.id,
        workspaceId,
        { projectId: project.id, versionId: current.id },
        deps,
      )
    : [];
  const open = comments.filter((comment) => !comment.resolved);
  const resolved = comments.filter((comment) => comment.resolved);
  const names = new Map(
    team.map((member) => [member.userId, personLabel(member)]),
  );
  const dateTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const projectId = project.id;
  // Função de render, não componente: evita remontar a cada render.
  function renderComment(comment: (typeof comments)[number]) {
    return (
      <li key={comment.id} className="rounded-xl border p-3">
        <p className="text-sm">
          {comment.timestampSeconds !== null ? (
            <span className="font-medium tabular-nums">
              {formatTimestamp(comment.timestampSeconds)} —{" "}
            </span>
          ) : null}
          <span className="whitespace-pre-wrap">{comment.text}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {comment.authorId
            ? (names.get(comment.authorId) ?? "Ex-membro")
            : "Ex-membro"}
          {" · "}
          <time dateTime={comment.createdAt.toISOString()}>
            {dateTime.format(comment.createdAt)}
          </time>
          {comment.resolved && comment.resolvedById
            ? ` · resolvido por ${names.get(comment.resolvedById) ?? "ex-membro"}`
            : null}
        </p>
        {canEdit && current ? (
          <form action={resolveReviewCommentAction} className="mt-2">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="versionId" value={current.id} />
            <input type="hidden" name="commentId" value={comment.id} />
            <input
              type="hidden"
              name="resolved"
              value={comment.resolved ? "false" : "true"}
            />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-lg border px-3 text-sm"
            >
              {comment.resolved ? "Reabrir" : "Resolver"}
            </button>
          </form>
        ) : null}
      </li>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ProductionTabs projectId={project.id} active="Revisão" />
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">Revisão</h1>
        <p className="text-sm text-muted-foreground">{project.title}</p>
      </header>
      {current === null ? (
        <EmptyState
          title="Nenhuma versão para revisar"
          description="Envie a primeira versão na aba Edição."
        />
      ) : (
        <>
          <section className="space-y-2 rounded-xl border p-3">
            <p className="text-sm text-muted-foreground">
              {current.id === versions[0].id
                ? "Versão atual"
                : "Versão anterior"}
            </p>
            <h2 className="text-lg font-medium">
              {versionLabel(current.versionNumber)}
              {current.title ? ` · ${current.title}` : null}
            </h2>
            {current.notes ? (
              <p className="text-sm whitespace-pre-wrap">{current.notes}</p>
            ) : null}
            <div className="flex flex-wrap gap-x-4">
              {current.previewUrl ? (
                <a
                  href={current.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
                >
                  Assistir vídeo
                </a>
              ) : null}
              {current.fileUrl ? (
                <a
                  href={current.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
                >
                  Abrir arquivo
                </a>
              ) : null}
            </div>
          </section>
          {canEdit ? (
            <ReviewCommentForm projectId={project.id} versionId={current.id} />
          ) : null}
          <section className="space-y-2">
            <h2 className="text-base font-medium">
              Comentários abertos
              <span className="font-normal text-muted-foreground">
                {" "}
                · {open.length}
              </span>
            </h2>
            {open.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum comentário aberto.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {open.map((comment) => renderComment(comment))}
              </ul>
            )}
          </section>
          {resolved.length > 0 ? (
            <details className="space-y-2">
              <summary className="inline-flex min-h-11 cursor-pointer items-center text-base font-medium">
                Resolvidos · {resolved.length}
              </summary>
              <ul className="mt-2 flex flex-col gap-2">
                {resolved.map((comment) => renderComment(comment))}
              </ul>
            </details>
          ) : null}
          <section className="space-y-2 border-t pt-6">
            <h2 className="text-base font-medium">Histórico de versões</h2>
            <ol className="flex flex-col gap-1">
              {versions.map((version) => (
                <li key={version.id}>
                  <Link
                    href={`/producoes/${project.id}/revisao?versao=${version.id}`}
                    aria-current={
                      version.id === current.id ? "page" : undefined
                    }
                    className={`inline-flex min-h-11 items-center gap-2 text-sm ${
                      version.id === current.id
                        ? "font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {versionLabel(version.versionNumber)}
                    {version.title ? ` · ${version.title}` : null}
                    <time dateTime={version.createdAt.toISOString()}>
                      · {dateTime.format(version.createdAt)}
                    </time>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
