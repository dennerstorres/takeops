import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { stripPhaseClass } from "@/components/ui/strip";
import { stripPhase } from "@/components/ui/strip-phase";
import { TabLink, TabNav } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  projectStatusLabel,
  type VideoProjectStatus,
} from "@/server/project-labels";
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

// Cabeça da produção em todas as abas: a própria tira da produção (mesma
// etiqueta do quadro) presa no trilho das abas. Na visão geral o título é
// o h1 da página; nas outras abas o h1 é o nome da aba.
export async function ProductionTabs({
  project,
  active = "Visão Geral",
  canEdit = false,
}: {
  project: { id: string; title: string; status: VideoProjectStatus };
  active?: (typeof productionTabs)[number];
  canEdit?: boolean;
}) {
  const t = await getTranslations();
  const phase = stripPhase(project.status);
  const stage = projectStatusLabel(t, project.status);
  const Title = active === "Visão Geral" ? "h1" : "p";

  return (
    <div className="flex flex-col gap-1 rounded-md bg-frame p-1 text-frame-foreground">
      <div
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-[2px] pr-1 pl-2 text-strip-ink",
          stripPhaseClass[phase],
        )}
      >
        <span
          title={stage}
          className="flex items-center self-stretch border-r border-strip-ink/15 pr-3 font-condensed text-xs font-semibold tracking-wider uppercase"
        >
          <span aria-hidden="true">{t(`strip.phase.${phase}`)}</span>
          <span className="sr-only">{stage}</span>
        </span>
        <Title className="min-w-0 flex-1 truncate text-base font-semibold">
          {project.title}
        </Title>
        <span
          aria-hidden="true"
          className="hidden font-condensed text-xs font-medium tracking-wide text-strip-ink-muted uppercase sm:inline"
        >
          {stage}
        </span>
        {canEdit ? (
          <Link
            href={`/producoes/${project.id}/editar`}
            className="inline-flex h-11 items-center rounded-[2px] border border-strip-ink/25 px-2.5 font-condensed text-xs font-semibold tracking-wider uppercase transition-colors hover:bg-strip-ink/5 focus-visible:outline-2 focus-visible:outline-ring sm:h-7"
          >
            {t("common.edit")}
          </Link>
        ) : null}
      </div>
      <TabNav label={t("tabs.label")} className="bg-transparent p-0">
        {productionTabs.map((label) => (
          <TabLink
            key={label}
            href={links[label](project.id)}
            current={label === active}
          >
            {t(tabKey[label])}
          </TabLink>
        ))}
      </TabNav>
    </div>
  );
}
