import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { prismaCalendarRepository } from "@/server/calendar-prisma";
import { loadDashboard, upcomingDays } from "@/server/dashboard";
import { prismaDashboardRepository } from "@/server/dashboard-prisma";
import { prismaIdeaRepository } from "@/server/idea-prisma";
import { prismaParticipantRepository } from "@/server/participant-prisma";
import { prismaProjectRepository } from "@/server/project-prisma";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

type ProjectCard = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  people: string[];
  shootDate: string | null;
  status: string;
  nextAction: string;
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
      <h2 className="text-base font-medium">
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

function ProjectList({ cards }: { cards: ProjectCard[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {cards.map((card) => (
        <li key={card.id}>
          <Link
            href={`/producoes/${card.id}`}
            className="flex min-h-11 gap-3 rounded-xl border p-3 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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
              <span className="text-sm text-muted-foreground">
                {card.status}
                {card.shootDate ? ` · gravação ${card.shootDate}` : ""}
              </span>
              {card.people.length > 0 ? (
                <span className="truncate text-sm text-muted-foreground">
                  {card.people.join(", ")}
                </span>
              ) : null}
              <span className="text-sm">Próximo: {card.nextAction}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function Home() {
  const t = await getTranslations();
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
      projects: prismaProjectRepository,
      ideas: prismaIdeaRepository,
      participants: prismaParticipantRepository,
      calendar: prismaCalendarRepository,
      dashboard: prismaDashboardRepository,
    },
    t,
  );

  const when = new Intl.DateTimeFormat("pt-BR", {
    timeZone: workspace.timezone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Como anda a produção de {workspace.name}.
        </p>
      </header>

      <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {data.counters.map((item) => (
          <div key={item.label} className="rounded-xl border p-3">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="text-2xl font-medium tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>

      <Section title="Próximas gravações">
        {data.shoots.length === 0 ? (
          <EmptyState
            title="Nenhuma gravação marcada"
            description={`As gravações dos próximos ${upcomingDays} dias aparecem aqui.`}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {data.shoots.map((shoot) => (
              <li key={shoot.key}>
                <Link
                  href={shoot.href}
                  className="flex min-h-11 flex-col gap-1 rounded-xl border p-3 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span className="text-sm font-medium first-letter:uppercase">
                    {shoot.at ? when.format(shoot.at) : shoot.day}
                    {" · "}
                    {shoot.label}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {shoot.projectTitle}
                    {shoot.status ? ` · ${shoot.status}` : ""}
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

      <Section title="Aguardando aprovação" count={data.approval.length}>
        {data.approval.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum pedido de aprovação aberto.
          </p>
        ) : (
          <ProjectList cards={data.approval} />
        )}
      </Section>

      <Section title="Aguardando revisão" count={data.review.length}>
        {data.review.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma produção em revisão.
          </p>
        ) : (
          <ProjectList cards={data.review} />
        )}
      </Section>

      <Section title="Produções em andamento">
        {data.inProgress.length === 0 ? (
          <EmptyState
            title="Nenhuma produção em andamento"
            description="Produções entre a pré-produção e o agendamento aparecem aqui."
            action={
              <Link
                href="/producoes"
                className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
              >
                Ver produções
              </Link>
            }
          />
        ) : (
          <ProjectList cards={data.inProgress} />
        )}
      </Section>

      <Section title="Ideias recentes">
        {data.ideas.length === 0 ? (
          <EmptyState
            title="Nenhuma ideia aberta"
            description="As ideias novas da equipe aparecem aqui."
            action={
              <Link
                href="/ideias"
                className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
              >
                Anotar ideia
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {data.ideas.map((idea) => (
              <li key={idea.id}>
                <Link
                  href={`/ideias/${idea.id}`}
                  className="flex min-h-11 flex-col justify-center rounded-xl border px-3 py-2 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
