import Link from "next/link";
import { SectionPage } from "@/components/shell/section-page";
import { ItemList, ItemListRow } from "@/components/ui/item-list";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <SectionPage
        title="Configurações"
        description="Os dados do workspace aparecem aqui."
      />
      <nav aria-label="Configurações">
        <ItemList>
          <ItemListRow className="p-0">
            <Link
              href="/configuracoes/equipamentos"
              className="flex min-h-11 w-full items-center px-4 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Equipamentos
            </Link>
          </ItemListRow>
          <ItemListRow className="p-0">
            <Link
              href="/configuracoes/checklists"
              className="flex min-h-11 w-full items-center px-4 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Checklists
            </Link>
          </ItemListRow>
        </ItemList>
      </nav>
    </div>
  );
}
