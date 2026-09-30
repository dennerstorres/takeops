import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ItemForm,
  TemplateForm,
} from "@/components/checklists/checklist-forms";
import { DeleteTemplateButton } from "@/components/checklists/delete-template-button";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { getChecklistTemplate } from "@/server/checklist";
import {
  moveChecklistItemAction,
  removeChecklistItemAction,
} from "@/server/checklist-actions";
import { prismaChecklistRepository } from "@/server/checklist-prisma";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

const buttonClass =
  "inline-flex min-h-11 items-center rounded-lg border px-3 text-sm disabled:opacity-40";

export default async function ChecklistTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const { templateId } = await params;
  const role = access.workspace.membership.role;
  const canEdit = role === "OWNER" || role === "ADMIN";

  let template;
  try {
    template = await getChecklistTemplate(
      session.user.id,
      access.workspace.workspace.id,
      templateId,
      prismaWorkspaceRepository,
      prismaChecklistRepository,
    );
  } catch (error) {
    if (error instanceof NotFoundError) redirect("/configuracoes/checklists");
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/configuracoes/checklists"
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground"
      >
        {t("checklists.back")}
      </Link>
      <header className="flex flex-col gap-0.5 rounded-md bg-frame px-3 py-2 text-frame-foreground">
        <h1 className="font-condensed text-xl font-semibold tracking-wider uppercase">
          {template.name}
        </h1>
        <p className="text-sm text-frame-foreground/80">
          {t("checklists.unchangedCopies")}
        </p>
      </header>
      {canEdit ? (
        <TemplateForm
          values={{
            templateId: template.id,
            name: template.name,
            type: template.type,
          }}
        />
      ) : null}
      <section className="space-y-3">
        <h2 className="text-base font-medium">{t("checklists.items")}</h2>
        {template.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("checklists.noItems")}
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {template.items.map((item, index) => (
              <li key={item.id} className="rounded-md border p-3">
                {canEdit ? (
                  <div className="space-y-2">
                    <ItemForm
                      templateId={template.id}
                      itemId={item.id}
                      text={item.text}
                    />
                    <div className="flex flex-wrap gap-2">
                      <form
                        action={moveChecklistItemAction}
                        className="flex gap-2"
                      >
                        <input
                          type="hidden"
                          name="templateId"
                          value={template.id}
                        />
                        <input type="hidden" name="itemId" value={item.id} />
                        <button
                          type="submit"
                          name="direction"
                          value="up"
                          disabled={index === 0}
                          className={buttonClass}
                        >
                          {t("checklists.moveUp")}
                        </button>
                        <button
                          type="submit"
                          name="direction"
                          value="down"
                          disabled={index === template.items.length - 1}
                          className={buttonClass}
                        >
                          {t("checklists.moveDown")}
                        </button>
                      </form>
                      <form action={removeChecklistItemAction}>
                        <input
                          type="hidden"
                          name="templateId"
                          value={template.id}
                        />
                        <input type="hidden" name="itemId" value={item.id} />
                        <button type="submit" className={buttonClass}>
                          {t("checklists.remove")}
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">
                    {item.order}. {item.text}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
        {canEdit ? <ItemForm templateId={template.id} text="" /> : null}
      </section>
      {canEdit ? <DeleteTemplateButton templateId={template.id} /> : null}
    </div>
  );
}
