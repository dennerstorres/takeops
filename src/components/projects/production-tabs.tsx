import Link from "next/link";
import { productionTabs } from "@/server/project-overview";

const links: Record<string, (projectId: string) => string> = {
  "Visão Geral": (projectId) => `/producoes/${projectId}`,
  Roteiro: (projectId) => `/producoes/${projectId}/roteiro`,
  Cenas: (projectId) => `/producoes/${projectId}/cenas`,
};

export function ProductionTabs({
  projectId,
  active = "Visão Geral",
}: {
  projectId: string;
  active?: "Visão Geral" | "Roteiro" | "Cenas";
}) {
  return (
    <nav aria-label="Seções da produção" className="flex gap-1 overflow-x-auto">
      {productionTabs.map((label) =>
        links[label] ? (
          <Link
            key={label}
            href={links[label](projectId)}
            aria-current={label === active ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm ${
              label === active
                ? "bg-muted font-medium"
                : "text-muted-foreground"
            }`}
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
