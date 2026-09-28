import { projectPriorities, videoProjectStatuses } from "./project-labels.ts";
import type { ProjectRecord } from "./project-repository.ts";

export type ProjectSearch = {
  text: string;
  status: string;
  ownerId: string;
  participantId: string;
  product: string;
  priority: string;
  shootFrom: string;
  shootTo: string;
  publishFrom: string;
  publishTo: string;
};

const emptySearch: ProjectSearch = {
  text: "",
  status: "",
  ownerId: "",
  participantId: "",
  product: "",
  priority: "",
  shootFrom: "",
  shootTo: "",
  publishFrom: "",
  publishTo: "",
};

function first(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw.trim() : "";
}

export function parseProjectSearch(
  input: Record<string, string | string[] | undefined>,
): ProjectSearch {
  return {
    text: first(input.q),
    status: first(input.status),
    ownerId: first(input.ownerId),
    participantId: first(input.participantId),
    product: first(input.product),
    priority: first(input.priority),
    shootFrom: first(input.shootFrom),
    shootTo: first(input.shootTo),
    publishFrom: first(input.publishFrom),
    publishTo: first(input.publishTo),
  };
}

export function hasProjectSearch(query: ProjectSearch) {
  return Object.values(query).some((value) => value !== "");
}

function includes(value: string | null, needle: string) {
  if (!needle) return true;
  return (value ?? "").toLocaleLowerCase("pt-BR").includes(
    needle.toLocaleLowerCase("pt-BR"),
  );
}

function day(value: Date | null) {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

function inRange(value: string | null, from: string, to: string) {
  if (!from && !to) return true;
  if (!value) return false;
  if (from && value < from) return false;
  if (to && value > to) return false;
  return true;
}

export function filterProjects(
  projects: readonly ProjectRecord[],
  participants: readonly { videoProjectId: string; userId: string }[],
  query: ProjectSearch,
) {
  const knownStatus = new Set<string>(videoProjectStatuses);
  const knownPriority = new Set<string>(projectPriorities);
  const people = new Map<string, Set<string>>();
  for (const row of participants) {
    const set = people.get(row.videoProjectId) ?? new Set<string>();
    set.add(row.userId);
    people.set(row.videoProjectId, set);
  }

  return projects.filter((project) => {
    if (!includes(project.title, query.text)) return false;
    if (query.status && (!knownStatus.has(query.status) || project.status !== query.status)) {
      return false;
    }
    if (query.priority && (!knownPriority.has(query.priority) || project.priority !== query.priority)) {
      return false;
    }
    if (query.ownerId && project.ownerId !== query.ownerId) return false;
    if (query.participantId && !people.get(project.id)?.has(query.participantId)) {
      return false;
    }
    if (!includes(project.product, query.product)) return false;
    if (!inRange(day(project.plannedShootDate), query.shootFrom, query.shootTo)) {
      return false;
    }
    if (!inRange(day(project.plannedPublishDate), query.publishFrom, query.publishTo)) {
      return false;
    }
    return true;
  });
}

export { emptySearch };
