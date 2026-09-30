import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import type { Translate } from "@/i18n/translate";
import { buttonVariants } from "@/components/ui/button";
import { surfaceClass, surfaceLinkClass } from "@/components/ui/card";
import { ItemList, ItemListRow } from "@/components/ui/item-list";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { prismaCalendarRepository } from "@/server/calendar-prisma";
import { loadDashboard, upcomingDays } from "@/server/dashboard";
import { prismaDashboardRepository } from "@/server/dashboard-prisma";
import { prismaParticipantRepository } from "@/server/participant-prisma";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

type ProjectCard = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  people: string[];
  shootDate: string | null;
  status: string;
  statusCode: string;
};

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">
        {title}
        {count !== undefined ? (
          <span className="ml-2 text-muted-foreground tabular-nums">
            {count}
          </span>
        ) : null}
      </h2>
      {children}
    </section>
  );
}

function ProjectList({ cards, t }: { cards: ProjectCard[]; t: Translate }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {cards.map((card) => (
        <li key={card.id}>
          <Link
            href={`/producoes/${card.id}`}
            className={cn(surfaceLinkClass, "gap-3 p-3")}
          >
            {card.thumbnailUrl ? (
              // URL externa da produção; o app não define remotePatterns.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.thumbnailUrl}
                alt=""
                className="size-14 shrink-0 rounded-lg object-cover"
              />
            ) : null}
            <span className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-sm font-medium">{card.title}</span>
              <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <StatusBadge status={card.statusCode}>
                  {card.status}
                </StatusBadge>
                {card.shootDate
                  ? t("dashboard.shootOn", { date: card.shootDate })
                  : null}
              </span>
              {card.people.length > 0 ? (
                <span className="truncate text-sm text-muted-foreground">
                  {card.people.join(", ")}
                </span>
              ) : null}
              <span className="text-sm">
                {t("dashboard.next", {
                  action: t(`dashboard.nextAction.${card.statusCode}`),
                })}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
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

  const when = new Intl.DateTimeFormat(locale, {
    timeZone: workspace.timezone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.subtitle", { workspace: workspace.name })}
        </p>
      </header>

      <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {data.counters.map((item) => (
          <div key={item.key} className={cn(surfaceClass, "p-3")}>
            <dt className="text-xs text-muted-foreground">
              {t(`dashboard.counters.${item.key}`)}
            </dt>
            <dd className="text-2xl font-medium tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>

      <Section title={t("dashboard.shoots")}>
        {data.shoots.length === 0 ? (
          <EmptyState
            title={t("dashboard.shootsEmptyTitle")}
            description={t("dashboard.shootsEmpty", { days: upcomingDays })}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {data.shoots.map((shoot) => (
              <li key={shoot.key}>
                <Link
                  href={shoot.href}
                  className={cn(surfaceLinkClass, "flex-col gap-1 p-3")}
                >
                  <span className="text-sm font-medium first-letter:uppercase">
                    {shoot.at ? when.format(shoot.at) : shoot.day}
                    {" · "}
                    {shoot.label}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 truncate text-sm text-muted-foreground">
                    {shoot.projectTitle}
                    {shoot.status && shoot.statusCode ? (
                      <StatusBadge status={shoot.statusCode}>
                        {shoot.status}
                      </StatusBadge>
                    ) : null}
                  </span>
                  {shoot.people.length > 0 ? (
                    <span className="truncate text-sm text-muted-foreground">
                      {shoot.people.join(", ")}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t("dashboard.approval")} count={data.approval.length}>
        {data.approval.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.approvalEmpty")}
          </p>
        ) : (
          <ProjectList cards={data.approval} t={t} />
        )}
      </Section>

      <Section title={t("dashboard.review")} count={data.review.length}>
        {data.review.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.reviewEmpty")}
          </p>
        ) : (
          <ProjectList cards={data.review} t={t} />
        )}
      </Section>

      <Section title={t("dashboard.inProgress")}>
        {data.inProgress.length === 0 ? (
          <EmptyState
            title={t("dashboard.inProgressEmptyTitle")}
            description={t("dashboard.inProgressEmpty")}
            action={
              <Link
                href="/producoes"
                className={buttonVariants({ variant: "outline" })}
              >
                {t("dashboard.viewProductions")}
              </Link>
            }
          />
        ) : (
          <ProjectList cards={data.inProgress} t={t} />
        )}
      </Section>

      <Section title={t("dashboard.recentIdeas")}>
        {data.ideas.length === 0 ? (
          <EmptyState
            title={t("dashboard.ideasEmptyTitle")}
            description={t("dashboard.ideasEmpty")}
            action={
              <Link
                href="/ideias"
                className={buttonVariants({ variant: "outline" })}
              >
                {t("dashboard.addIdea")}
              </Link>
            }
          />
        ) : (
          <ItemList>
            {data.ideas.map((idea) => (
              <ItemListRow key={idea.id} className="p-0">
                <Link
                  href={`/ideias/${idea.id}`}
                  className="flex min-h-11 w-full flex-col justify-center px-4 py-3 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span className="truncate text-sm font-medium">
                    {idea.title}
                  </span>
                  {idea.authorName ? (
                    <span className="text-sm text-muted-foreground">
                      {idea.authorName}
                    </span>
                  ) : null}
                </Link>
              </ItemListRow>
            ))}
          </ItemList>
        )}
      </Section>
    </div>
  );
}
