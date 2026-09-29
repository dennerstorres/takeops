import Link from "next/link";
import { redirect } from "next/navigation";
import {
  addDays,
  monthGrid,
  parseDayParam,
  parseMonth,
  shiftMonth,
  weekDays,
} from "@/lib/calendar-grid";
import { utcToZonedLocal, zonedLocalToUtc } from "@/lib/zoned-time";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { listCalendarEvents, type CalendarEvent } from "@/server/calendar";
import { prismaCalendarRepository } from "@/server/calendar-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const kindClass: Record<CalendarEvent["kind"], string> = {
  SHOOT: "bg-sky-500",
  PLANNED_PUBLISH: "bg-amber-500",
  PUBLICATION: "bg-emerald-500",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    mes?: string | string[];
    semana?: string | string[];
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const workspaceId = access.workspace.workspace.id;
  const timezone = access.workspace.workspace.timezone;

  const today = utcToZonedLocal(new Date(), timezone).slice(0, 10);
  const query = await searchParams;
  // ?semana=AAAA-MM-DD abre a semana daquele dia; senão, o mês.
  const weekDay = parseDayParam(query.semana);
  const view = weekDay ? "week" : "month";
  const month = parseMonth(query.mes) ?? (weekDay ?? today).slice(0, 7);
  const grid = weekDay ? weekDays(weekDay) : monthGrid(month);
  const last = grid[grid.length - 1];
  // A grade vai de domingo a sábado no fuso do workspace; os limites viram
  // instantes UTC para a consulta.
  const from = zonedLocalToUtc(`${grid[0]}T00:00`, timezone);
  const to = zonedLocalToUtc(`${addDays(last, 1)}T00:00`, timezone);
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
  const shortDay = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
  });
  const title =
    view === "week"
      ? `Semana de ${shortDay.format(new Date(`${grid[0]}T00:00:00.000Z`))} a ${shortDay.format(new Date(`${last}T00:00:00.000Z`))}`
      : monthTitle;
  const nav =
    view === "week"
      ? {
          previous: `/calendario?semana=${addDays(grid[0], -7)}`,
          today: `/calendario?semana=${today}`,
          next: `/calendario?semana=${addDays(grid[0], 7)}`,
        }
      : {
          previous: `/calendario?mes=${shiftMonth(month, -1)}`,
          today: "/calendario",
          next: `/calendario?mes=${shiftMonth(month, 1)}`,
        };
  // Trocar de visão mantém o período: a semana do dia 1º do mês ou o mês da
  // semana aberta.
  const switchHref =
    view === "week"
      ? `/calendario?mes=${month}`
      : `/calendario?semana=${month === today.slice(0, 7) ? today : `${month}-01`}`;
  const linkClass =
    "inline-flex min-h-11 items-center rounded-lg border px-3 text-sm";
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
    (day) => (view === "week" || day.startsWith(month)) && byDay.has(day),
  );

  function renderEvent(event: CalendarEvent, compact: boolean) {
    return (
      <li key={event.key}>
        <Link
          href={event.href}
          className={`block rounded-md bg-muted/50 px-2 py-1 text-xs ${event.canceled ? "line-through opacity-60" : ""} ${
            compact ? "" : "min-h-11 py-2 text-sm"
          }`}
        >
          {event.at ? (
            <span className="tabular-nums">{time.format(event.at)} </span>
          ) : null}
          <span
            aria-hidden
            className={`mr-1 inline-block size-2 rounded-full ${kindClass[event.kind]}`}
          />
          <span className="font-medium">{event.label}</span>
          {event.canceled ? (
            <span className="sr-only"> (cancelada)</span>
          ) : null}
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
          <p className="text-sm text-muted-foreground first-letter:uppercase">
            {title}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <nav aria-label="Período" className="flex gap-2">
            <Link href={nav.previous} className={linkClass}>
              Anterior
            </Link>
            <Link href={nav.today} className={linkClass}>
              Hoje
            </Link>
            <Link href={nav.next} className={linkClass}>
              Próximo
            </Link>
          </nav>
          <Link href={switchHref} className={linkClass}>
            {view === "week" ? "Ver mês" : "Ver semana"}
          </Link>
        </div>
      </header>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className="size-2 rounded-full bg-sky-500" />
          Gravação
        </span>
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className="size-2 rounded-full bg-amber-500" />
          Publicação planejada
        </span>
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className="size-2 rounded-full bg-emerald-500" />
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
              className={`border-r border-b p-1 [&:nth-child(7n)]:border-r-0 ${
                view === "week" ? "min-h-64" : "min-h-28"
              } ${
                view === "week" || day.startsWith(month)
                  ? ""
                  : "bg-muted/30 text-muted-foreground"
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
            {view === "week"
              ? "Nada marcado nesta semana."
              : "Nada marcado neste mês."}
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
