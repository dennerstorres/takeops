import type { Translate } from "../i18n/translate.ts";
import type { ParticipantRecord } from "./participant-repository.ts";
import { calendarDate } from "./project-overview.ts";
import {
  priorityLabel,
  projectStatusLabel,
  type VideoProjectStatus,
} from "./project-labels.ts";
import type { ProjectRecord } from "./project-repository.ts";

// Ordem das colunas (spec §14); o arquivado fica no fim.
export const boardColumns: { status: VideoProjectStatus }[] = [
  { status: "IDEA" },
  { status: "PRE_PRODUCTION" },
  { status: "SCRIPTING" },
  { status: "READY_TO_RECORD" },
  { status: "RECORDING" },
  { status: "EDITING" },
  { status: "REVIEW" },
  { status: "APPROVED" },
  { status: "SCHEDULED" },
  { status: "PUBLISHED" },
  { status: "ARCHIVED" },
];

// Números por produção que o card mostra; a página busca em lote.
export type BoardStats = {
  readyScenes?: Readonly<Record<string, number>>;
  checklists?: Readonly<Record<string, { done: number; total: number }>>;
};

export function projectAlerts(
  t: Translate,
  status: VideoProjectStatus,
  readySceneCount: number,
) {
  if (status === "READY_TO_RECORD" && readySceneCount < 1) {
    return [t("projects.alerts.noReadyScenes")];
  }
  return [];
}

// Ponta da tira no quadro (ADR-045): pendência quando há alerta; parada
// quando a produção está arquivada ou pronta para gravar sem data marcada.
export function projectTip(
  status: VideoProjectStatus,
  alerts: readonly string[],
  plannedShootDate: Date | null,
): "ok" | "pending" | "idle" {
  if (alerts.length > 0) return "pending";
  if (status === "ARCHIVED") return "idle";
  if (status === "READY_TO_RECORD" && !plannedShootDate) return "idle";
  return "ok";
}

function personLabel(
  t: Translate,
  person: { name: string | null; email: string | null } | undefined,
) {
  return person?.name || person?.email || t("common.noName");
}

export function buildProjectBoard(
  projects: readonly ProjectRecord[],
  participants: readonly Pick<
    ParticipantRecord,
    "videoProjectId" | "userId" | "name" | "email"
  >[],
  people: readonly {
    userId: string;
    name: string | null;
    email: string | null;
  }[],
  t: Translate,
  stats: BoardStats = {},
) {
  const directory = new Map(people.map((person) => [person.userId, person]));
  for (const participant of participants) {
    if (!directory.has(participant.userId))
      directory.set(participant.userId, participant);
  }
  const byProject = new Map<string, (typeof participants)[number][]>();
  for (const participant of participants) {
    const rows = byProject.get(participant.videoProjectId) ?? [];
    rows.push(participant);
    byProject.set(participant.videoProjectId, rows);
  }

  return boardColumns.map((column) => ({
    status: column.status,
    title: projectStatusLabel(t, column.status),
    cards: projects
      .filter((project) => project.status === column.status)
      .map((project) => {
        const names: string[] = [];
        const seen = new Set<string>();
        const add = (userId: string | null) => {
          if (!userId || seen.has(userId)) return;
          seen.add(userId);
          names.push(personLabel(t, directory.get(userId)));
        };
        add(project.ownerId);
        for (const participant of byProject.get(project.id) ?? []) {
          add(participant.userId);
        }
        const alerts = projectAlerts(
          t,
          project.status,
          stats.readyScenes?.[project.id] ?? 0,
        );
        return {
          id: project.id,
          title: project.title,
          thumbnailUrl: project.thumbnailUrl,
          people: names,
          shootDate: calendarDate(project.plannedShootDate),
          priority: priorityLabel(t, project.priority),
          alerts,
          tip: projectTip(project.status, alerts, project.plannedShootDate),
          checklist: stats.checklists?.[project.id] ?? null,
        };
      }),
  }));
}
