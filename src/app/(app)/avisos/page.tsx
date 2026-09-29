import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { listMyNotifications } from "@/server/notification";
import { markNotificationsReadAction } from "@/server/notification-actions";
import {
  describeNotification,
  type NotificationType,
} from "@/server/notification-labels";
import { prismaNotificationRepository } from "@/server/notification-prisma";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

function personLabel(member: { name: string | null; email: string | null }) {
  return member.name || member.email || "Sem nome";
}

// Para onde o aviso leva: versão e revisão abrem a aba Revisão.
function target(type: NotificationType, projectId: string | null) {
  if (!projectId) return null;
  return type === "PROJECT_MEMBER_ADDED"
    ? `/producoes/${projectId}`
    : `/producoes/${projectId}/revisao`;
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const workspaceId = access.workspace.workspace.id;
  const timezone = access.workspace.workspace.timezone;

  const [rows, team] = await Promise.all([
    listMyNotifications(session.user.id, workspaceId, {
      workspaces: prismaWorkspaceRepository,
      notifications: prismaNotificationRepository,
    }),
    listTeam(session.user.id, workspaceId, prismaWorkspaceRepository),
  ]);
  const names = new Map(
    team.map((member) => [member.userId, personLabel(member)]),
  );
  const unread = rows.filter((row) => !row.readAt).length;
  const dateTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const buttonClass =
    "inline-flex min-h-11 items-center rounded-lg border px-3 text-sm";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">Avisos</h1>
          <p className="text-sm text-muted-foreground">
            {unread === 0
              ? "Tudo lido."
              : unread === 1
                ? "1 aviso não lido."
                : `${unread} avisos não lidos.`}
          </p>
        </div>
        {unread > 0 ? (
          <form action={markNotificationsReadAction}>
            <button type="submit" className={buttonClass}>
              Marcar todos como lidos
            </button>
          </form>
        ) : null}
      </header>
      {rows.length === 0 ? (
        <EmptyState
          title="Nenhum aviso"
          description="Novas versões, pedidos de alteração e aprovações aparecem aqui."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => {
            const href = target(row.type, row.videoProjectId);
            return (
              <li
                key={row.id}
                className={`rounded-xl border p-3 ${
                  row.readAt ? "" : "border-primary/40 bg-primary/5"
                }`}
              >
                <p className="text-sm">
                  {row.readAt ? null : <span className="sr-only">Novo: </span>}
                  {describeNotification(
                    row.actorId
                      ? (names.get(row.actorId) ?? "Ex-membro")
                      : "Alguém",
                    row.type,
                    row.projectTitle,
                    row.metadata,
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  <time dateTime={row.createdAt.toISOString()}>
                    {dateTime.format(row.createdAt)}
                  </time>
                </p>
                {href || !row.readAt ? (
                  <form
                    action={markNotificationsReadAction}
                    className="mt-2 flex flex-wrap gap-2"
                  >
                    <input type="hidden" name="notificationId" value={row.id} />
                    {href ? (
                      <button
                        type="submit"
                        name="next"
                        value={href}
                        className={buttonClass}
                      >
                        Abrir
                      </button>
                    ) : null}
                    {row.readAt ? null : (
                      <button type="submit" className={buttonClass}>
                        Marcar como lido
                      </button>
                    )}
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
