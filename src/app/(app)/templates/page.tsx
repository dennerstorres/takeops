import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProductionTemplateForm } from "@/components/templates/production-template-form";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { listProductionTemplates } from "@/server/production-template";
import { prismaProductionTemplateRepository } from "@/server/production-template-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const role = access.workspace.membership.role;
  const canManage = role === "OWNER" || role === "ADMIN";
  const templates = await listProductionTemplates(
    session.user.id,
    access.workspace.workspace.id,
    {
      workspaces: prismaWorkspaceRepository,
      templates: prismaProductionTemplateRepository,
    },
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Modelos de produção com cenas e checklist prontos para copiar.
        </p>
      </header>
      {canManage ? (
        <details className="rounded-xl border p-3">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium">
            Novo template
          </summary>
          <div className="mt-2">
            <ProductionTemplateForm values={{ name: "", description: "" }} />
          </div>
        </details>
      ) : null}
      {templates.length === 0 ? (
        <EmptyState
          title="Nenhum template"
          description="Os modelos de produção do workspace aparecem aqui."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {templates.map((template) => (
            <li key={template.id}>
              <Link
                href={`/templates/${template.id}`}
                className="flex min-h-11 flex-col rounded-xl border p-3"
              >
                <span className="text-sm font-medium">{template.name}</span>
                {template.description ? (
                  <span className="line-clamp-2 text-sm text-muted-foreground">
                    {template.description}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
