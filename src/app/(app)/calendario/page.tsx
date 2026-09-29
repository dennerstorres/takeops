import Link from "next/link";
import { redirect } from "next/navigation";
import {
  monthGrid,
  parseMonth,
  shiftMonth,
  addDays,
} from "@/lib/calendar-grid";
import { utcToZonedLocal, zonedLocalToUtc } from "@/lib/zoned-time";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { listCalendarEvents, type CalendarEvent } from "@/server/calendar";
import { prismaCalendarRepository } from "@/server/calendar-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const kindClass: Record<CalendarEvent["kind"], string> = {
  SHOOT: "border-l-sky-500",
  PLANNED_PUBLISH: "border-l-amber-500",
  PUBLICATION: "border-l-emerald-500",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const workspaceId = access.workspace.workspace.id;
  const timezone = access.workspace.workspace.timezone;

  const today = utcToZonedLocal(new Date(), timezone).slice(0, 10);
  const month = parseMonth((await searchParams).mes) ?? today.slice(0, 7);
  const grid = monthGrid(month);
  // A grade vai de domingo a sábado no fuso do workspace; os limites viram
  // instantes UTC para a consulta.
  const from = zonedLocalToUtc(`${grid[0]}T00:00`, timezone);
  const to = zonedLocalToUtc(`${addDays(grid[41], 1)}T00:00`, timezone);
  if (!from || !to) throw new Error("Fuso do workspace inválido.");

  const events = await listCalendarEvents(
    session.user.id,
    workspaceId,
    { from, to, timezone },
    {
      workspaces: prismaWorkspaceRepository,
      calendar: prismaCalendarRepository,
    },
  );

  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  });
  const monthTitle = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00.000Z`));
  const dayTitle = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  const byDay = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const day = event.day ?? utcToZonedLocal(event.at!, timezone).slice(0, 10);
    byDay.set(day, [...(byDay.get(day) ?? []), event]);
  }
  const daysWithEvents = grid.filter(
    (day) => day.startsWith(month) && byDay.has(day),
  );

  function renderEvent(event: CalendarEvent, compact: boolean) {
    return (
      <li key={event.key}>
        <Link
          href={event.href}
          className={`block rounded-md border-l-4 bg-muted/50 px-2 py-1 text-xs ${
            kindClass[event.kind]
          } ${event.canceled ? "line-through opacity-60" : ""} ${
            compact ? "" : "min-h-11 py-2 text-sm"
          }`}
        >
          {event.at ? (
            <span className="tabular-nums">{time.format(event.at)} </span>
          ) : null}
          <span className="font-medium">{event.label}</span>
          <span className="block truncate text-muted-foreground">
            {event.projectTitle}
          </span>
        </Link>
      </li>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">Calendário</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {monthTitle}
          </p>
        </div>
        <nav aria-label="Mês" className="flex gap-2">
          <Link
            href={`/calendario?mes=${shiftMonth(month, -1)}`}
            className="inline-flex min-h-11 items-center rounded-lg border px-3 text-sm"
          >
            Anterior
          </Link>
          <Link
            href="/calendario"
            className="inline-flex min-h-11 items-center rounded-lg border px-3 text-sm"
          >
            Hoje
          </Link>
          <Link
            href={`/calendario?mes=${shiftMonth(month, 1)}`}
            className="inline-flex min-h-11 items-center rounded-lg border px-3 text-sm"
          >
            Próximo
          </Link>
        </nav>
      </header>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="border-l-4 border-l-sky-500 pl-1">Gravação</span>
        <span className="border-l-4 border-l-amber-500 pl-1">
          Publicação planejada
        </span>
        <span className="border-l-4 border-l-emerald-500 pl-1">
          Publicação agendada ou feita
        </span>
      </p>

      <div className="hidden overflow-hidden rounded-xl border md:block">
        <div className="grid grid-cols-7 border-b bg-muted/40 text-xs text-muted-foreground">
          {weekdays.map((name) => (
            <div key={name} className="px-2 py-1">
              {name}
            </div>
          ))}
        </div>
        <ol className="grid grid-cols-7">
          {grid.map((day) => (
            <li
              key={day}
              className={`min-h-28 border-r border-b p-1 [&:nth-child(7n)]:border-r-0 ${
                day.startsWith(month) ? "" : "bg-muted/30 text-muted-foreground"
              }`}
            >
              <p
                className={`mb-1 text-xs ${
                  day === today ? "font-semibold text-foreground" : ""
                }`}
              >
                <time dateTime={day}>{Number(day.slice(8))}</time>
                {day === today ? (
                  <span className="sr-only"> (hoje)</span>
                ) : null}
              </p>
              <ul className="flex flex-col gap-1">
                {(byDay.get(day) ?? []).map((event) =>
                  renderEvent(event, true),
                )}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      <div className="md:hidden">
        {daysWithEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nada marcado neste mês.
          </p>
        ) : (
          <ol className="flex flex-col gap-4">
            {daysWithEvents.map((day) => (
              <li key={day} className="space-y-2">
                <h2 className="text-sm font-medium capitalize">
                  <time dateTime={day}>
                    {dayTitle.format(new Date(`${day}T00:00:00.000Z`))}
                  </time>
                  {day === today ? " · hoje" : null}
                </h2>
                <ul className="flex flex-col gap-2">
                  {(byDay.get(day) ?? []).map((event) =>
                    renderEvent(event, false),
                  )}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
