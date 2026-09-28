import Link from "next/link";
import { SectionPage } from "@/components/shell/section-page";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <SectionPage
        title="Configurações"
        description="Os dados do workspace aparecem aqui."
      />
      <Link
        href="/configuracoes/equipamentos"
        className="inline-flex min-h-11 w-fit items-center rounded-lg border px-3 text-sm"
      >
        Equipamentos
      </Link>
    </div>
  );
}
