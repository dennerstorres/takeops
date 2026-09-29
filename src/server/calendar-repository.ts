import type { ShootStatus } from "./shoot-labels.ts";
import type { Platform, PublicationStatus } from "./publication-labels.ts";

type ProjectRef = { projectId: string; projectTitle: string };

export type CalendarShootRow = ProjectRef & {
  id: string;
  title: string | null;
  scheduledAt: Date;
  status: ShootStatus;
};

export type CalendarPlannedRow = ProjectRef & { plannedPublishDate: Date };

export type CalendarPublicationRow = ProjectRef & {
  id: string;
  platform: Platform;
  status: PublicationStatus;
  scheduledAt: Date | null;
  publishedAt: Date | null;
};

// Leituras do workspace inteiro num intervalo [from, to). Só produções
// visíveis (sem exclusão) do workspace aberto.
export type CalendarRepository = {
  shoots(
    workspaceId: string,
    from: Date,
    to: Date,
  ): Promise<CalendarShootRow[]>;
  plannedPublishes(
    workspaceId: string,
    from: Date,
    to: Date,
  ): Promise<CalendarPlannedRow[]>;
  publications(
    workspaceId: string,
    from: Date,
    to: Date,
  ): Promise<CalendarPublicationRow[]>;
};
