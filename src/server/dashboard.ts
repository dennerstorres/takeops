import type { CalendarEvent } from "./calendar.ts";
import { listCalendarEvents, type CalendarDeps } from "./calendar.ts";
import type { IdeaRecord, IdeaRepository } from "./idea-repository.ts";
import { listIdeas } from "./idea.ts";
import { buildProjectBoard } from "./project-board.ts";
import {
  projectStatusLabel,
  type VideoProjectStatus,
} from "./project-labels.ts";
import type {
  ParticipantRecord,
  ParticipantRepository,
} from "./participant-repository.ts";
import { listProjects } from "./project.ts";
import type { ProjectRecord, ProjectRepository } from "./project-repository.ts";
import { requireMembership } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

// Aprovação pendente é por produção; o dashboard só precisa saber quais.
export type DashboardRepository = {
  pendingApprovalProjectIds(workspaceId: string): Promise<string[]>;
};

export type DashboardDeps = CalendarDeps & {
  workspaces: WorkspaceRepository;
  projects: ProjectRepository;
  ideas: IdeaRepository;
  participants: ParticipantRepository;
  dashboard: DashboardRepository;
};

const idle: readonly VideoProjectStatus[] = ["IDEA", "PUBLISHED", "ARCHIVED"];

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
}) {
  const board = buildProjectBoard(
    input.projects,
    input.participants,
    input.people,
  );
  const cards = new Map(
    board.flatMap((column) => column.cards).map((card) => [card.id, card]),
  );
  const byId = new Map(input.projects.map((project) => [project.id, project]));
  const card = (project: ProjectRecord) => ({
    ...cards.get(project.id)!,
    status: projectStatusLabel(project.status),
    nextAction: nextAction[project.status],
  });
  const recent = (a: ProjectRecord, b: ProjectRecord) =>
    b.updatedAt.getTime() - a.updatedAt.getTime();

  const pending = new Set(input.pendingApprovalProjectIds);
  const count = (status: VideoProjectStatus) =>
    input.projects.filter((project) => project.status === status).length;
  const openIdeas = input.ideas.filter(
    (idea) => idea.status !== "CONVERTED" && idea.status !== "DISCARDED",
  );

  return {
    shoots: input.shoots
      .filter((event) => event.kind === "SHOOT" && !event.canceled)
      .slice(0, listSize)
      .map((event) => ({
        ...event,
        people: cards.get(event.projectId)?.people ?? [],
        status: byId.get(event.projectId)
          ? projectStatusLabel(byId.get(event.projectId)!.status)
          : null,
      })),
    inProgress: input.projects
      .filter((project) => !idle.includes(project.status))
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
      { label: "Ideias", value: openIdeas.length },
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
) {
  await requireMembership(userId, workspaceId, deps.workspaces);
  const to = new Date(range.now.getTime() + upcomingDays * 86_400_000);
  const [projects, ideas, events, pendingIds] = await Promise.all([
    listProjects(userId, workspaceId, deps.workspaces, deps.projects),
    listIdeas(userId, workspaceId, deps.workspaces, deps.ideas),
    listCalendarEvents(
      userId,
      workspaceId,
      { from: range.now, to, timezone: range.timezone },
      deps,
    ),
    deps.dashboard.pendingApprovalProjectIds(workspaceId),
  ]);
  const participants = await deps.participants.listByProjectIds(
    projects.map((project) => project.id),
  );
  return buildDashboard({
    projects,
    ideas,
    shoots: events,
    participants,
    people,
    pendingApprovalProjectIds: pendingIds,
  });
}
