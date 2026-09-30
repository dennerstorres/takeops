import { getLocale, getTranslations } from "next-intl/server";
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
import { buttonVariants } from "@/components/ui/button";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { listCalendarEvents, type CalendarEvent } from "@/server/calendar";
import { prismaCalendarRepository } from "@/server/calendar-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

const weekdayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const kindClass: Record<CalendarEvent["kind"], string> = {
  SHOOT: "bg-info",
  PLANNED_PUBLISH: "bg-warning",
  PUBLICATION: "bg-success",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    mes?: string | string[];
    semana?: string | string[];
  }>;
}) {
  const t = await getTranslations();
  const locale = await getLocale();
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
    t,
  );

  const time = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  });
  const monthTitle = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00.000Z`));
  const shortDay = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
  });
  const title =
    view === "week"
      ? t("calendar.weekRange", {
          from: shortDay.format(new Date(`${grid[0]}T00:00:00.000Z`)),
          to: shortDay.format(new Date(`${last}T00:00:00.000Z`)),
        })
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
  const linkClass = buttonVariants({ variant: "outline" });
  const dayTitle = new Intl.DateTimeFormat(locale, {
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
            className={`mr-1 inline-block size-2.5 rounded-[2px] ${kindClass[event.kind]}`}
          />
          <span className="font-medium">{event.label}</span>
          {event.canceled ? (
            <span className="sr-only">{t("calendar.canceled")}</span>
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
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-frame px-3 py-2 text-frame-foreground">
        <div className="space-y-1">
          <h1 className="font-condensed text-xl font-semibold tracking-wider uppercase">
            {t("calendar.title")}
          </h1>
          <p className="text-sm text-frame-foreground/80 first-letter:uppercase">
            {title}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <nav aria-label={t("calendar.period")} className="flex gap-2">
            <Link href={nav.previous} className={linkClass}>
              {t("calendar.previous")}
            </Link>
            <Link href={nav.today} className={linkClass}>
              {t("calendar.today")}
            </Link>
            <Link href={nav.next} className={linkClass}>
              {t("calendar.next")}
            </Link>
          </nav>
          <Link href={switchHref} className={linkClass}>
            {t("calendar.switchView", { view })}
          </Link>
        </div>
      </header>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className="size-2.5 rounded-[2px] bg-info" />
          {t("calendar.shoot")}
        </span>
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className="size-2.5 rounded-[2px] bg-warning" />
          {t("calendar.plannedPublication")}
        </span>
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className="size-2.5 rounded-[2px] bg-success" />
          {t("calendar.publication")}
        </span>
      </p>

      <div className="hidden overflow-hidden rounded-md border bg-card md:block">
        <div className="grid grid-cols-7 border-b bg-muted/40 text-xs text-muted-foreground">
          {weekdayKeys.map((key) => (
            <div key={key} className="px-2 py-1">
              {t(`calendar.weekdays.${key}`)}
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
              <p className="mb-1 text-xs">
                <time
                  dateTime={day}
                  className={
                    day === today
                      ? "inline-flex size-6 items-center justify-center rounded-[2px] bg-primary text-primary-foreground"
                      : undefined
                  }
                >
                  {Number(day.slice(8))}
                </time>
                {day === today ? (
                  <span className="sr-only">{t("calendar.todayMark")}</span>
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
            {t("calendar.empty", { view })}
          </p>
        ) : (
          <ol className="flex flex-col gap-4">
            {daysWithEvents.map((day) => (
              <li key={day} className="space-y-2">
                <h2 className="text-sm font-medium capitalize">
                  <time dateTime={day}>
                    {dayTitle.format(new Date(`${day}T00:00:00.000Z`))}
                  </time>
                  {day === today ? t("calendar.todayInline") : null}
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
