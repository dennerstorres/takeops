import type { Translate } from "../i18n/translate.ts";
import type { ParticipantRecord } from "./participant-repository.ts";
import { calendarDate } from "./project-overview.ts";
import { priorityLabel, type VideoProjectStatus } from "./project-labels.ts";
import type { ProjectRecord } from "./project-repository.ts";

export const boardColumns: { status: VideoProjectStatus; title: string }[] = [
  { status: "IDEA", title: "Ideias" },
  { status: "PRE_PRODUCTION", title: "Pré-produção" },
  { status: "SCRIPTING", title: "Roteiro" },
  { status: "READY_TO_RECORD", title: "Pronto para gravar" },
  { status: "RECORDING", title: "Gravação" },
  { status: "EDITING", title: "Edição" },
  { status: "REVIEW", title: "Revisão" },
  { status: "APPROVED", title: "Aprovado" },
  { status: "SCHEDULED", title: "Agendado" },
  { status: "PUBLISHED", title: "Publicado" },
  { status: "ARCHIVED", title: "Arquivado" },
];

export function projectAlerts(
  status: VideoProjectStatus,
  readySceneCount: number,
) {
  if (status === "READY_TO_RECORD" && readySceneCount < 1) {
    return ["Não há cenas prontas."];
  }
  return [];
}

function personLabel(
  person: { name: string | null; email: string | null } | undefined,
) {
  if (!person) return "Sem nome";
  return person.name || person.email || "Sem nome";
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
  // Cena ainda não é um módulo. Sem contagem, não há cena pronta.
  t: Translate,
  readySceneCounts: Readonly<Record<string, number>> = {},
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
    title: column.title,
    cards: projects
      .filter((project) => project.status === column.status)
      .map((project) => {
        const names: string[] = [];
        const seen = new Set<string>();
        const add = (userId: string | null) => {
          if (!userId || seen.has(userId)) return;
          seen.add(userId);
          names.push(personLabel(directory.get(userId)));
        };
        add(project.ownerId);
        for (const participant of byProject.get(project.id) ?? []) {
          add(participant.userId);
        }
        return {
          id: project.id,
          title: project.title,
          thumbnailUrl: project.thumbnailUrl,
          people: names,
          shootDate: calendarDate(project.plannedShootDate),
          priority: priorityLabel(t, project.priority),
          alerts: projectAlerts(
            project.status,
            readySceneCounts[project.id] ?? 0,
          ),
        };
      }),
  }));
}
