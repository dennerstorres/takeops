import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { ItemList, ItemListRow } from "@/components/ui/item-list";
import { cn } from "@/lib/utils";
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

// Para onde o aviso leva: versão e revisão abrem a aba Revisão.
function target(type: NotificationType, projectId: string | null) {
  if (!projectId) return null;
  if (type === "PROJECT_MEMBER_ADDED") return `/producoes/${projectId}`;
  if (type === "SHOOT_UPCOMING") return `/producoes/${projectId}/gravacao`;
  return `/producoes/${projectId}/revisao`;
}

export default async function NotificationsPage() {
  const t = await getTranslations();
  const locale = await getLocale();
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
    team.map((member) => [
      member.userId,
      member.name || member.email || t("common.noName"),
    ]),
  );
  const unread = rows.filter((row) => !row.readAt).length;
  const dateTime = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">
            {t("notifications.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("notifications.unread", { count: unread })}
          </p>
        </div>
        {unread > 0 ? (
          <form action={markNotificationsReadAction}>
            <Button type="submit" variant="outline">
              {t("notifications.markAllRead")}
            </Button>
          </form>
        ) : null}
      </header>
      {rows.length === 0 ? (
        <EmptyState
          title={t("notifications.emptyTitle")}
          description={t("notifications.emptyDescription")}
        />
      ) : (
        <ItemList>
          {rows.map((row) => {
            const href = target(row.type, row.videoProjectId);
            return (
              <ItemListRow
                key={row.id}
                className={cn(
                  "flex-col items-stretch gap-1",
                  row.readAt ? "" : "bg-info-muted",
                )}
              >
                <p className="text-sm">
                  {row.readAt ? null : (
                    <span className="sr-only">
                      {t("notifications.newPrefix")}
                    </span>
                  )}
                  {describeNotification(
                    t,
                    row.actorId
                      ? (names.get(row.actorId) ?? t("common.formerMember"))
                      : t("common.someone"),
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
                      <Button
                        type="submit"
                        name="next"
                        value={href}
                        variant="outline"
                      >
                        {t("notifications.open")}
                      </Button>
                    ) : null}
                    {row.readAt ? null : (
                      <Button type="submit" variant="outline">
                        {t("notifications.markRead")}
                      </Button>
                    )}
                  </form>
                ) : null}
              </ItemListRow>
            );
          })}
        </ItemList>
      )}
    </div>
  );
}
