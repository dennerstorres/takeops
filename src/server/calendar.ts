import { utcToZonedLocal } from "../lib/zoned-time.ts";
import type {
  CalendarPlannedRow,
  CalendarPublicationRow,
  CalendarRepository,
  CalendarShootRow,
} from "./calendar-repository.ts";
import { ValidationError } from "./errors.ts";
import { platformLabel } from "./publication-labels.ts";
import { requireMembership } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

// Calendário é derivado (CAL-001): gravações, datas planejadas de
// publicação e publicações agendadas ou feitas. Não há tabela própria.
export type CalendarEvent = {
  key: string;
  kind: "SHOOT" | "PLANNED_PUBLISH" | "PUBLICATION";
  projectId: string;
  projectTitle: string;
  label: string;
  href: string;
  // Evento com hora usa `at` (UTC). Data planejada é dia inteiro e usa
  // `day` (AAAA-MM-DD), sem fuso, para não mudar de dia na conversão.
  at: Date | null;
  day: string | null;
  canceled: boolean;
};

export type CalendarDeps = {
  workspaces: WorkspaceRepository;
  calendar: CalendarRepository;
};

// Um intervalo grande demais vira consulta pesada; seis semanas cobrem a
// grade do mês com folga.
const MAX_RANGE_MS = 45 * 24 * 60 * 60 * 1000;

export function buildCalendarEvents(
  shoots: CalendarShootRow[],
  planned: CalendarPlannedRow[],
  publications: CalendarPublicationRow[],
  from: Date,
  to: Date,
  days: { first: string; last: string },
): CalendarEvent[] {
  const inRange = (date: Date | null): date is Date =>
    date !== null && date >= from && date < to;
  const events: CalendarEvent[] = [];
  for (const shoot of shoots) {
    events.push({
      key: `shoot-${shoot.id}`,
      kind: "SHOOT",
      projectId: shoot.projectId,
      projectTitle: shoot.projectTitle,
      label: shoot.title ? `Gravação · ${shoot.title}` : "Gravação",
      href: `/producoes/${shoot.projectId}/gravacao`,
      at: shoot.scheduledAt,
      day: null,
      canceled: shoot.status === "CANCELED",
    });
  }
  for (const row of planned) {
    const day = row.plannedPublishDate.toISOString().slice(0, 10);
    if (day < days.first || day > days.last) continue;
    events.push({
      key: `planned-${row.projectId}`,
      kind: "PLANNED_PUBLISH",
      projectId: row.projectId,
      projectTitle: row.projectTitle,
      label: "Publicação planejada",
      href: `/producoes/${row.projectId}`,
      at: null,
      day,
      canceled: false,
    });
  }
  for (const row of publications) {
    // Publicada aparece no dia em que saiu; senão, no agendamento.
    const at =
      row.status === "PUBLISHED" && inRange(row.publishedAt)
        ? row.publishedAt
        : inRange(row.scheduledAt)
          ? row.scheduledAt
          : null;
    if (!at) continue;
    events.push({
      key: `publication-${row.id}`,
      kind: "PUBLICATION",
      projectId: row.projectId,
      projectTitle: row.projectTitle,
      label:
        row.status === "PUBLISHED"
          ? `Publicada · ${platformLabel(row.platform)}`
          : `Publicação · ${platformLabel(row.platform)}`,
      href: `/producoes/${row.projectId}/publicacao`,
      at,
      day: null,
      canceled: row.status === "CANCELED",
    });
  }
  const sortKey = (event: CalendarEvent) =>
    event.at ? event.at.toISOString() : `${event.day}T00:00:00.000Z`;
  return events.sort((left, right) =>
    sortKey(left) === sortKey(right)
      ? left.key.localeCompare(right.key)
      : sortKey(left) < sortKey(right)
        ? -1
        : 1,
  );
}

// O intervalo chega como instantes [from, to) já calculados no fuso do
// workspace. A data planejada é dia inteiro: entra quando o dia dela cai
// entre o primeiro e o último dia do intervalo nesse fuso.
export async function listCalendarEvents(
  userId: string,
  workspaceId: string,
  range: { from: Date; to: Date; timezone: string },
  deps: CalendarDeps,
) {
  const membership = await requireMembership(
    userId,
    workspaceId,
    deps.workspaces,
  );
  const { from, to, timezone } = range;
  if (
    Number.isNaN(from.getTime()) ||
    Number.isNaN(to.getTime()) ||
    to <= from ||
    to.getTime() - from.getTime() > MAX_RANGE_MS
  ) {
    throw new ValidationError({ range: "Intervalo de datas inválido." });
  }
  const days = {
    first: utcToZonedLocal(from, timezone).slice(0, 10),
    last: utcToZonedLocal(new Date(to.getTime() - 1), timezone).slice(0, 10),
  };
  const dayStart = new Date(`${days.first}T00:00:00.000Z`);
  const dayEnd = new Date(
    new Date(`${days.last}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000,
  );
  const [shoots, planned, publications] = await Promise.all([
    deps.calendar.shoots(membership.workspaceId, from, to),
    deps.calendar.plannedPublishes(membership.workspaceId, dayStart, dayEnd),
    deps.calendar.publications(membership.workspaceId, from, to),
  ]);
  return buildCalendarEvents(shoots, planned, publications, from, to, days);
}
