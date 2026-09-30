import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { Card } from "@/components/ui/card";
import { ItemList, ItemListRow } from "@/components/ui/item-list";
import { ProductionTemplateForm } from "@/components/templates/production-template-form";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { listProductionTemplates } from "@/server/production-template";
import { prismaProductionTemplateRepository } from "@/server/production-template-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function TemplatesPage() {
  const t = await getTranslations();
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
        <h1 className="text-2xl font-medium tracking-tight">
          {t("templates.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("templates.description")}
        </p>
      </header>
      {canManage ? (
        <Card>
          <details>
            <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium">
              {t("templates.new")}
            </summary>
            <div className="mt-2">
              <ProductionTemplateForm values={{ name: "", description: "" }} />
            </div>
          </details>
        </Card>
      ) : null}
      {templates.length === 0 ? (
        <EmptyState
          title={t("templates.emptyTitle")}
          description={t("templates.emptyDescription")}
        />
      ) : (
        <ItemList>
          {templates.map((template) => (
            <ItemListRow key={template.id} className="p-0">
              <Link
                href={`/templates/${template.id}`}
                className="flex min-h-11 w-full flex-col px-4 py-3 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="text-sm font-medium">{template.name}</span>
                {template.description ? (
                  <span className="line-clamp-2 text-sm text-muted-foreground">
                    {template.description}
                  </span>
                ) : null}
              </Link>
            </ItemListRow>
          ))}
        </ItemList>
      )}
    </div>
  );
}
