import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Translate } from "@/i18n/translate";
import { buttonVariants } from "@/components/ui/button";
import {
  Strip,
  StripBoard,
  StripEmpty,
  StripGroup,
  stripPhaseClass,
} from "@/components/ui/strip";
import { stripPhase, type StripTip } from "@/components/ui/strip-phase";
import { cn } from "@/lib/utils";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { prismaCalendarRepository } from "@/server/calendar-prisma";
import {
  dashboardCounters,
  loadDashboard,
  upcomingDays,
} from "@/server/dashboard";
import { prismaDashboardRepository } from "@/server/dashboard-prisma";
import { prismaParticipantRepository } from "@/server/participant-prisma";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

type ProjectCard = {
  id: string;
  title: string;
  people: string[];
  shootDate: string | null;
  priority: string;
  tip: StripTip;
  status: string;
  statusCode: string;
};

// Cor da legenda de cada contador: a mesma cartolina da etapa que ele conta.
const counterStatus: Record<string, string> = {
  ideas: "IDEA",
  ...Object.fromEntries(
    dashboardCounters.map((item) => [item.key, item.status]),
  ),
};

const emptyAction = cn(
  buttonVariants({ variant: "outline" }),
  "h-11 bg-card sm:h-7",
);

// "Aaaa-mm-dd" de data planejada (dia inteiro) para dd/mm, sem fuso.
function shortDay(day: string | null) {
  if (!day) return null;
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}

function ProjectStrips({ cards, t }: { cards: ProjectCard[]; t: Translate }) {
  return cards.map((card) => (
    <Strip
      key={card.id}
      phase={stripPhase(card.statusCode)}
      stageLabel={card.status}
      number={card.priority}
      title={card.title}
      flag={
        <span className="hidden font-condensed text-xs text-strip-ink-muted sm:inline">
          {t("dashboard.next", {
            action: t(`dashboard.nextAction.${card.statusCode}`),
          })}
        </span>
      }
      owner={
        <span title={card.people.join(", ")}>{card.people.join(", ")}</span>
      }
      date={card.shootDate ?? "—"}
      tip={card.tip}
      href={`/producoes/${card.id}`}
    />
  ));
}

export default async function Home() {
  const t = await getTranslations();
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const workspace = access.workspace.workspace;

  const team = await listTeam(
    session.user.id,
    workspace.id,
    prismaWorkspaceRepository,
  );
  const data = await loadDashboard(
    session.user.id,
    workspace.id,
    { now: new Date(), timezone: workspace.timezone },
    team,
    {
      workspaces: prismaWorkspaceRepository,
      participants: prismaParticipantRepository,
      calendar: prismaCalendarRepository,
      dashboard: prismaDashboardRepository,
    },
    t,
  );

  const zone = { timeZone: workspace.timezone };
  const weekday = new Intl.DateTimeFormat(locale, {
    ...zone,
    weekday: "short",
  });
  const when = new Intl.DateTimeFormat(locale, {
    ...zone,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const ideaDay = new Intl.DateTimeFormat(locale, {
    ...zone,
    day: "2-digit",
    month: "2-digit",
  });

  return (
    <div className="flex w-full flex-col gap-3">
      <header className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md bg-frame px-3 py-2 text-frame-foreground">
        <h1 className="font-condensed text-xl font-semibold tracking-wider uppercase">
          {t("dashboard.title")}
        </h1>
        {/* Contadores como legenda impressa do quadro: cor da etapa + nome. */}
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 font-condensed text-xs font-medium tracking-wide uppercase">
          {data.counters.map((item) => (
            <div key={item.key} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  "h-3.5 w-1.5 rounded-[1px]",
                  stripPhaseClass[stripPhase(counterStatus[item.key] ?? "")],
                )}
              />
              <dt>{t(`dashboard.counters.${item.key}`)}</dt>
              <dd className="text-sm font-semibold tabular-nums">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <StripBoard label={t("dashboard.title")}>
        <StripGroup label={t("dashboard.shoots")} count={data.shoots.length}>
          {data.shoots.length === 0 ? (
            <StripEmpty>
              {t("dashboard.shootsEmpty", { days: upcomingDays })}
            </StripEmpty>
          ) : (
            data.shoots.map((shoot) => (
              <Strip
                key={shoot.key}
                phase={stripPhase(shoot.statusCode ?? "")}
                stageLabel={shoot.status ?? shoot.label}
                number={
                  shoot.at ? (
                    <span className="uppercase">
                      {weekday.format(shoot.at)}
                    </span>
                  ) : null
                }
                title={shoot.projectTitle}
                flag={
                  <span className="hidden font-condensed text-xs text-strip-ink-muted sm:inline">
                    {shoot.label}
                  </span>
                }
                owner={
                  <span title={shoot.people.join(", ")}>
                    {shoot.people.join(", ")}
                  </span>
                }
                date={shoot.at ? when.format(shoot.at) : shortDay(shoot.day)}
                tip="ok"
                href={shoot.href}
              />
            ))
          )}
        </StripGroup>

        <StripGroup
          label={t("dashboard.approval")}
          count={data.approval.length}
        >
          {data.approval.length === 0 ? (
            <StripEmpty>{t("dashboard.approvalEmpty")}</StripEmpty>
          ) : (
            <ProjectStrips cards={data.approval} t={t} />
          )}
        </StripGroup>

        <StripGroup label={t("dashboard.review")} count={data.review.length}>
          {data.review.length === 0 ? (
            <StripEmpty>{t("dashboard.reviewEmpty")}</StripEmpty>
          ) : (
            <ProjectStrips cards={data.review} t={t} />
          )}
        </StripGroup>

        <StripGroup
          label={t("dashboard.inProgress")}
          count={data.inProgress.length}
        >
          {data.inProgress.length === 0 ? (
            <StripEmpty
              action={
                <Link href="/producoes" className={emptyAction}>
                  {t("dashboard.viewProductions")}
                </Link>
              }
            >
              {t("dashboard.inProgressEmpty")}
            </StripEmpty>
          ) : (
            <ProjectStrips cards={data.inProgress} t={t} />
          )}
        </StripGroup>

        <StripGroup
          label={t("dashboard.recentIdeas")}
          count={data.ideas.length}
        >
          {data.ideas.length === 0 ? (
            <StripEmpty
              action={
                <Link href="/ideias" className={emptyAction}>
                  {t("dashboard.addIdea")}
                </Link>
              }
            >
              {t("dashboard.ideasEmpty")}
            </StripEmpty>
          ) : (
            data.ideas.map((idea) => (
              <Strip
                key={idea.id}
                phase="plan"
                stageLabel={t("dashboard.counters.ideas")}
                title={idea.title}
                owner={idea.authorName}
                date={ideaDay.format(idea.createdAt)}
                tip="ok"
                href={`/ideias/${idea.id}`}
              />
            ))
          )}
        </StripGroup>
      </StripBoard>
    </div>
  );
}
