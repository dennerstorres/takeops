import { TabLink, TabNav } from "@/components/ui/tabs";
import { productionTabs } from "@/server/project-overview";

const links: Record<string, (projectId: string) => string> = {
  "Visão Geral": (projectId) => `/producoes/${projectId}`,
  Roteiro: (projectId) => `/producoes/${projectId}/roteiro`,
  Cenas: (projectId) => `/producoes/${projectId}/cenas`,
  Gravação: (projectId) => `/producoes/${projectId}/gravacao`,
  Edição: (projectId) => `/producoes/${projectId}/edicao`,
  Revisão: (projectId) => `/producoes/${projectId}/revisao`,
  Publicação: (projectId) => `/producoes/${projectId}/publicacao`,
  Atividade: (projectId) => `/producoes/${projectId}/atividade`,
};

export function ProductionTabs({
  projectId,
  active = "Visão Geral",
}: {
  projectId: string;
  active?: (typeof productionTabs)[number];
}) {
  return (
    <TabNav label="Seções da produção">
      {productionTabs.map((label) =>
        links[label] ? (
          <TabLink
            key={label}
            href={links[label](projectId)}
            current={label === active}
          >
            {label}
          </TabLink>
        ) : (
          <span
            key={label}
            className="inline-flex min-h-11 shrink-0 items-center px-3 text-sm text-muted-foreground"
          >
            {label}
          </span>
        ),
      )}
    </TabNav>
  );
}
