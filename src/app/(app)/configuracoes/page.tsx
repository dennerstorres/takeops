import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SectionPage } from "@/components/shell/section-page";
import { surfaceClass } from "@/components/ui/card";
import { ItemList, ItemListRow } from "@/components/ui/item-list";
import { WorkspaceSettingsForm } from "@/components/workspace/workspace-settings-form";
import { cn } from "@/lib/utils";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";

// Lista do próprio runtime; o fuso atual entra mesmo se sair dela.
function timezoneOptions(current: string) {
  const zones = Intl.supportedValuesOf("timeZone");
  return zones.includes(current) ? zones : [current, ...zones];
}

export default async function SettingsPage() {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const { workspace, membership } = access.workspace;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <SectionPage
        title={t("settings.title")}
        description={t("settings.description")}
      />
      <section
        aria-labelledby="workspace-settings"
        className={cn(surfaceClass, "flex flex-col gap-4 p-4")}
      >
        <h2 id="workspace-settings" className="text-base font-medium">
          {t("settings.workspace")}
        </h2>
        {membership.role === "OWNER" ? (
          <WorkspaceSettingsForm
            values={{
              name: workspace.name,
              timezone: workspace.timezone,
              logoUrl: workspace.logoUrl ?? "",
            }}
            timezones={timezoneOptions(workspace.timezone)}
          />
        ) : (
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">{t("settings.name")}</dt>
              <dd>{workspace.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("settings.timezone")}
              </dt>
              <dd>{workspace.timezone}</dd>
            </div>
            <div>
              <dt className="sr-only">{t("settings.workspace")}</dt>
              <dd className="text-muted-foreground">
                {t("settings.ownerOnly")}
              </dd>
            </div>
          </dl>
        )}
      </section>
      <nav aria-label={t("settings.title")}>
        <ItemList>
          <ItemListRow className="p-0">
            <Link
              href="/configuracoes/equipamentos"
              className="flex min-h-11 w-full items-center px-4 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {t("equipment.title")}
            </Link>
          </ItemListRow>
          <ItemListRow className="p-0">
            <Link
              href="/configuracoes/checklists"
              className="flex min-h-11 w-full items-center px-4 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {t("checklists.title")}
            </Link>
          </ItemListRow>
        </ItemList>
      </nav>
    </div>
  );
}
