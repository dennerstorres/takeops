import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DeleteProductionTemplateButton,
  ProductionTemplateForm,
} from "@/components/templates/production-template-form";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { getProductionTemplate } from "@/server/production-template";
import { prismaProductionTemplateRepository } from "@/server/production-template-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const { templateId } = await params;
  const role = access.workspace.membership.role;
  const canManage = role === "OWNER" || role === "ADMIN";

  let template;
  try {
    template = await getProductionTemplate(
      session.user.id,
      access.workspace.workspace.id,
      templateId,
      {
        workspaces: prismaWorkspaceRepository,
        templates: prismaProductionTemplateRepository,
      },
    );
  } catch (error) {
    if (error instanceof NotFoundError) redirect("/templates");
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/templates"
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground"
      >
        Voltar aos templates
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">{template.name}</h1>
        {template.description ? (
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">
            {template.description}
          </p>
        ) : null}
      </header>
      {canManage ? (
        <section className="space-y-3 rounded-xl border p-3">
          <h2 className="text-sm font-medium">Dados do template</h2>
          <ProductionTemplateForm
            values={{
              templateId: template.id,
              name: template.name,
              description: template.description ?? "",
            }}
          />
          <DeleteProductionTemplateButton templateId={template.id} />
        </section>
      ) : null}
    </div>
  );
}
