import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { SectionPage } from "@/components/shell/section-page";
import { ItemList, ItemListRow } from "@/components/ui/item-list";

export default async function SettingsPage() {
  const t = await getTranslations();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <SectionPage
        title={t("settings.title")}
        description={t("settings.description")}
      />
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
