import Link from "next/link";
import { redirect } from "next/navigation";
import { TemplateForm } from "@/components/checklists/checklist-forms";
import { EmptyState } from "@/components/feedback/empty-state";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { listChecklistTemplates } from "@/server/checklist";
import { createRecommendedChecklistAction } from "@/server/checklist-actions";
import { prismaChecklistRepository } from "@/server/checklist-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function ChecklistsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const role = access.workspace.membership.role;
  const canEdit = role === "OWNER" || role === "ADMIN";
  const templates = await listChecklistTemplates(
    session.user.id,
    access.workspace.workspace.id,
    prismaWorkspaceRepository,
    prismaChecklistRepository,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/configuracoes"
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground"
      >
        Voltar às configurações
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">Checklists</h1>
        <p className="text-sm text-muted-foreground">
          Modelos copiados para cada gravação.
        </p>
      </header>
      {templates.length === 0 ? (
        <EmptyState
          title="Nenhum checklist"
          description="Os modelos de checklist do workspace aparecem aqui."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {templates.map((template) => (
            <li key={template.id}>
              <Link
                href={`/configuracoes/checklists/${template.id}`}
                className="flex min-h-11 flex-col rounded-xl border p-3"
              >
                <span className="text-sm font-medium">{template.name}</span>
                <span className="text-sm text-muted-foreground">
                  {template.type === "SHOOT" ? "Gravação" : "Outro"} ·{" "}
                  {template.items.length} itens
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {canEdit && !templates.some((template) => template.type === "SHOOT") ? (
        <form
          action={createRecommendedChecklistAction}
          className="space-y-2 rounded-xl border p-3"
        >
          <p className="text-sm">
            Comece pelo checklist recomendado: equipamentos e preparação, 22
            itens.
          </p>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-lg border px-3 text-sm"
          >
            Criar checklist recomendado
          </button>
        </form>
      ) : null}
      {canEdit ? (
        <section className="space-y-3">
          <h2 className="text-base font-medium">Novo checklist</h2>
          <TemplateForm values={{ name: "", type: "SHOOT" }} />
        </section>
      ) : null}
    </div>
  );
}
