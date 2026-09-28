import { formatLabel } from "./idea-labels.ts";
import { projectRoleLabel, type ProjectRole } from "./participant-labels.ts";
import type { ProjectRecord } from "./project-repository.ts";
import {
  aspectLabel,
  priorityLabel,
  projectStatusLabel,
  videoProjectStatuses,
} from "./project-labels.ts";

const mainFlow = videoProjectStatuses.filter((status) => status !== "ARCHIVED");

export const productionTabs = [
  "Visão Geral",
  "Roteiro",
  "Cenas",
  "Gravação",
  "Edição",
  "Revisão",
  "Publicação",
  "Atividade",
] as const;

export function calendarDate(value: Date | null) {
  if (!value) return null;
  const [year, month, day] = value.toISOString().slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function pipelineProgress(status: ProjectRecord["status"]) {
  if (status === "ARCHIVED") {
    return {
      step: null,
      total: mainFlow.length,
      label: projectStatusLabel(status),
    };
  }
  return {
    step: mainFlow.indexOf(status) + 1,
    total: mainFlow.length,
    label: projectStatusLabel(status),
  };
}

export function buildProjectOverview(input: {
  project: ProjectRecord;
  participants: {
    name: string | null;
    email: string | null;
    role: ProjectRole;
  }[];
  ownerName: string | null;
}) {
  const { project } = input;
  const progress = pipelineProgress(project.status);
  return {
    title: project.title,
    objective: project.objective,
    product: project.product,
    audience: project.audience,
    format: formatLabel(project.format),
    aspectRatio: aspectLabel(project.aspectRatio),
    duration: project.estimatedDurationSeconds
      ? `${project.estimatedDurationSeconds} s`
      : null,
    status: progress.label,
    progress:
      progress.step === null
        ? progress.label
        : `${progress.step} de ${progress.total}`,
    priority: priorityLabel(project.priority),
    shootDate: calendarDate(project.plannedShootDate),
    publishDate: calendarDate(project.plannedPublishDate),
    ownerName: input.ownerName,
    participants: input.participants.map((person) => ({
      name: person.name ?? person.email ?? "Sem nome",
      role: projectRoleLabel(person.role),
    })),
    links: [
      project.thumbnailUrl
        ? { label: "Thumbnail", href: project.thumbnailUrl }
        : null,
      project.sourceIdeaId
        ? { label: "Ideia de origem", href: `/ideias/${project.sourceIdeaId}` }
        : null,
    ].filter((link) => link !== null),
  };
}
