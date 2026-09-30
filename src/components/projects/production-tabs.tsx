import { getTranslations } from "next-intl/server";
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

const tabKey: Record<(typeof productionTabs)[number], string> = {
  "Visão Geral": "tabs.overview",
  Roteiro: "tabs.script",
  Cenas: "tabs.scenes",
  Gravação: "tabs.recording",
  Edição: "tabs.editing",
  Revisão: "tabs.review",
  Publicação: "tabs.publication",
  Atividade: "tabs.activity",
};

export async function ProductionTabs({
  projectId,
  active = "Visão Geral",
}: {
  projectId: string;
  active?: (typeof productionTabs)[number];
}) {
  const t = await getTranslations();

  return (
    <TabNav label={t("tabs.label")}>
      {productionTabs.map((label) =>
        links[label] ? (
          <TabLink
            key={label}
            href={links[label](projectId)}
            current={label === active}
          >
            {t(tabKey[label])}
          </TabLink>
        ) : (
          <span
            key={label}
            className="inline-flex min-h-11 shrink-0 items-center px-3 text-sm text-muted-foreground"
          >
            {t(tabKey[label])}
          </span>
        ),
      )}
    </TabNav>
  );
}
