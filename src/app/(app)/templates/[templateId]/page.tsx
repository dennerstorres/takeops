import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DeleteProductionTemplateButton,
  ProductionTemplateForm,
} from "@/components/templates/production-template-form";
import { TemplateChecklistForm } from "@/components/templates/template-checklist-form";
import { TemplateSceneForm } from "@/components/templates/template-scene-form";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { listChecklistTemplates } from "@/server/checklist";
import { prismaChecklistRepository } from "@/server/checklist-prisma";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import {
  getProductionTemplate,
  listTemplateScenes,
} from "@/server/production-template";
import { changeTemplateSceneAction } from "@/server/production-template-actions";
import { prismaProductionTemplateRepository } from "@/server/production-template-prisma";
import { sceneTypeLabel } from "@/server/scene-labels";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function TemplatePage({
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
  const canManage = role === "OWNER" || role === "ADMIN";

  const deps = {
    workspaces: prismaWorkspaceRepository,
    templates: prismaProductionTemplateRepository,
  };
  let template;
  let scenes;
  let checklists;
  try {
    template = await getProductionTemplate(
      session.user.id,
      access.workspace.workspace.id,
      templateId,
      deps,
    );
    [scenes, checklists] = await Promise.all([
      listTemplateScenes(
        session.user.id,
        access.workspace.workspace.id,
        template.id,
        deps,
      ),
      listChecklistTemplates(
        session.user.id,
        access.workspace.workspace.id,
        prismaWorkspaceRepository,
        prismaChecklistRepository,
      ),
    ]);
  } catch (error) {
    if (error instanceof NotFoundError) redirect("/templates");
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  const linkedChecklist =
    checklists.find((item) => item.id === template.checklistTemplateId) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/templates"
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground"
      >
        {t("templates.back")}
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
          <h2 className="text-sm font-medium">{t("templates.details")}</h2>
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
      <section id="cenas" className="space-y-3">
        <h2 className="text-base font-medium">{t("templates.scenes")}</h2>
        {scenes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("templates.noScenes")}
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {scenes.map((scene, index) => (
              <li key={scene.id} className="rounded-xl border p-3">
                <p className="text-sm font-medium">
                  {scene.order}. {scene.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {sceneTypeLabel(t, scene.type)}
                  {scene.description ? ` · ${scene.description}` : null}
                </p>
                {canManage ? (
                  <form
                    action={changeTemplateSceneAction}
                    className="mt-2 flex flex-wrap gap-2"
                  >
                    <input
                      type="hidden"
                      name="templateId"
                      value={template.id}
                    />
                    <input type="hidden" name="sceneId" value={scene.id} />
                    <button
                      type="submit"
                      name="intent"
                      value="up"
                      disabled={index === 0}
                      className="inline-flex min-h-11 items-center rounded-lg border px-3 text-sm disabled:opacity-40"
                    >
                      {t("templates.moveUp")}
                    </button>
                    <button
                      type="submit"
                      name="intent"
                      value="down"
                      disabled={index === scenes.length - 1}
                      className="inline-flex min-h-11 items-center rounded-lg border px-3 text-sm disabled:opacity-40"
                    >
                      {t("templates.moveDown")}
                    </button>
                    <button
                      type="submit"
                      name="intent"
                      value="remove"
                      className="inline-flex min-h-11 items-center rounded-lg border px-3 text-sm"
                    >
                      {t("templates.remove")}
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ol>
        )}
        {canManage ? (
          <div className="rounded-xl border p-3">
            <TemplateSceneForm templateId={template.id} />
          </div>
        ) : null}
      </section>
      <section id="checklist" className="space-y-3">
        <h2 className="text-base font-medium">{t("templates.checklist")}</h2>
        <p className="text-sm text-muted-foreground">
          {linkedChecklist
            ? t("templates.linkedChecklist", {
                name: linkedChecklist.name,
                count: linkedChecklist.items.length,
              })
            : t("templates.noLinkedChecklist")}
        </p>
        {canManage ? (
          <div className="rounded-xl border p-3">
            <TemplateChecklistForm
              templateId={template.id}
              current={template.checklistTemplateId ?? ""}
              options={checklists
                .filter((item) => item.type === "SHOOT")
                .map((item) => ({
                  id: item.id,
                  label: t("templates.checklistOption", {
                    name: item.name,
                    count: item.items.length,
                  }),
                }))}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
