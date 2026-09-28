import Link from "next/link";
import { productionTabs } from "@/server/project-overview";

export function ProductionTabs({ projectId }: { projectId: string }) {
  return (
    <nav aria-label="Seções da produção" className="flex gap-1 overflow-x-auto">
      {productionTabs.map((label) =>
        label === "Visão Geral" ? (
          <Link
            key={label}
            href={`/producoes/${projectId}`}
            aria-current="page"
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg bg-muted px-3 text-sm font-medium"
          >
            {label}
          </Link>
        ) : (
          <span
            key={label}
            className="inline-flex min-h-11 shrink-0 items-center px-3 text-sm text-muted-foreground"
          >
            {label}
          </span>
        ),
      )}
    </nav>
  );
}
