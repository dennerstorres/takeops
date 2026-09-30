import type { Translate } from "../i18n/translate.ts";
import type { CalendarEvent } from "./calendar.ts";
import { listCalendarEvents, type CalendarDeps } from "./calendar.ts";
import type { IdeaStatus } from "./idea-labels.ts";
import type { IdeaRecord } from "./idea-repository.ts";
import { buildProjectBoard } from "./project-board.ts";
import {
  projectStatusLabel,
  type VideoProjectStatus,
} from "./project-labels.ts";
import type {
  ParticipantRecord,
  ParticipantRepository,
} from "./participant-repository.ts";
import type { ProjectRecord } from "./project-repository.ts";
import { requireMembership } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

// O dashboard lê só o que mostra: produções em andamento (ou com aprovação
// pendente), contagem por status e as ideias abertas mais recentes. Assim o
// custo não cresce com o histórico de publicadas e arquivadas (HARDEN-006).
export type DashboardRepository = {
  pendingApprovalProjectIds(workspaceId: string): Promise<string[]>;
  activeProjects(workspaceId: string): Promise<ProjectRecord[]>;
  projectStatusCounts(
    workspaceId: string,
  ): Promise<Partial<Record<VideoProjectStatus, number>>>;
  openIdeas(
    workspaceId: string,
    limit: number,
  ): Promise<{ total: number; recent: IdeaRecord[] }>;
};

export type DashboardDeps = CalendarDeps & {
  workspaces: WorkspaceRepository;
  participants: ParticipantRepository;
  dashboard: DashboardRepository;
};

export const idleStatuses: readonly VideoProjectStatus[] = [
  "IDEA",
  "PUBLISHED",
  "ARCHIVED",
];
export const openIdeaExcluded: readonly IdeaStatus[] = [
  "CONVERTED",
  "DISCARDED",
];

// Próximo passo de cada etapa (spec §10, "próxima ação").
const nextAction: Record<VideoProjectStatus, string> = {
  IDEA: "Planejar a produção",
  PRE_PRODUCTION: "Escrever o roteiro",
  SCRIPTING: "Fechar roteiro e cenas",
  READY_TO_RECORD: "Marcar a gravação",
  RECORDING: "Registrar os takes",
  EDITING: "Enviar versão para revisão",
  REVIEW: "Revisar a versão",
  APPROVED: "Agendar a publicação",
  SCHEDULED: "Publicar",
  PUBLISHED: "Nada pendente",
  ARCHIVED: "Nada pendente",
};

export const dashboardCounters: {
  status: VideoProjectStatus;
  label: string;
}[] = [
  { status: "PRE_PRODUCTION", label: "Pré-produção" },
  { status: "RECORDING", label: "Gravação" },
  { status: "EDITING", label: "Edição" },
  { status: "REVIEW", label: "Revisão" },
  { status: "PUBLISHED", label: "Publicados" },
];

export const upcomingDays = 14;
const listSize = 5;

export function buildDashboard(input: {
  projects: readonly ProjectRecord[];
  ideas: readonly IdeaRecord[];
  openIdeaCount: number;
  statusCounts: Partial<Record<VideoProjectStatus, number>>;
  shoots: readonly CalendarEvent[];
  participants: readonly Pick<
    ParticipantRecord,
    "videoProjectId" | "userId" | "name" | "email"
  >[];
  people: readonly {
    userId: string;
    name: string | null;
    email: string | null;
  }[];
  pendingApprovalProjectIds: readonly string[];
  t: Translate;
}) {
  const { t } = input;
  const board = buildProjectBoard(
    input.projects,
    input.participants,
    input.people,
    t,
  );
  const cards = new Map(
    board.flatMap((column) => column.cards).map((card) => [card.id, card]),
  );
  const byId = new Map(input.projects.map((project) => [project.id, project]));
  const card = (project: ProjectRecord) => ({
    ...cards.get(project.id)!,
    status: projectStatusLabel(t, project.status),
    statusCode: project.status,
    nextAction: nextAction[project.status],
  });
  const recent = (a: ProjectRecord, b: ProjectRecord) =>
    b.updatedAt.getTime() - a.updatedAt.getTime();

  const pending = new Set(input.pendingApprovalProjectIds);
  const count = (status: VideoProjectStatus) =>
    input.statusCounts[status] ?? 0;
  const openIdeas = input.ideas.filter(
    (idea) => !openIdeaExcluded.includes(idea.status),
  );

  return {
    shoots: input.shoots
      .filter((event) => event.kind === "SHOOT" && !event.canceled)
      .slice(0, listSize)
      .map((event) => ({
        ...event,
        people: cards.get(event.projectId)?.people ?? [],
        status: byId.get(event.projectId)
          ? projectStatusLabel(t, byId.get(event.projectId)!.status)
          : null,
        statusCode: byId.get(event.projectId)?.status ?? null,
      })),
    inProgress: input.projects
      .filter((project) => !idleStatuses.includes(project.status))
      .sort(recent)
      .slice(0, listSize)
      .map(card),
    review: input.projects
      .filter((project) => project.status === "REVIEW")
      .sort(recent)
      .map(card),
    approval: input.projects
      .filter((project) => pending.has(project.id))
      .sort(recent)
      .map(card),
    ideas: [...openIdeas]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, listSize),
    counters: [
      { label: "Ideias", value: input.openIdeaCount },
      ...dashboardCounters.map((item) => ({
        label: item.label,
        value: count(item.status),
      })),
    ],
  };
}

export async function loadDashboard(
  userId: string,
  workspaceId: string,
  range: { now: Date; timezone: string },
  people: readonly {
    userId: string;
    name: string | null;
    email: string | null;
  }[],
  deps: DashboardDeps,
  t: Translate,
) {
  await requireMembership(userId, workspaceId, deps.workspaces);
  const to = new Date(range.now.getTime() + upcomingDays * 86_400_000);
  const [projects, statusCounts, ideas, events, pendingIds] = await Promise.all([
    deps.dashboard.activeProjects(workspaceId),
    deps.dashboard.projectStatusCounts(workspaceId),
    deps.dashboard.openIdeas(workspaceId, listSize),
    listCalendarEvents(
      userId,
      workspaceId,
      { from: range.now, to, timezone: range.timezone },
      deps,
      t,
    ),
    deps.dashboard.pendingApprovalProjectIds(workspaceId),
  ]);
  const participants = await deps.participants.listByProjectIds(
    projects.map((project) => project.id),
  );
  return buildDashboard({
    projects,
    ideas: ideas.recent,
    openIdeaCount: ideas.total,
    statusCounts,
    shoots: events,
    participants,
    people,
    pendingApprovalProjectIds: pendingIds,
    t,
  });
}
