import type {
  NotificationRepository,
  NotificationWrite,
} from "./notification-repository.ts";
import { requireMembership } from "./workspace.ts";
import type { WorkspaceRepository } from "./workspace-repository.ts";

export type NotificationDeps = {
  workspaces: WorkspaceRepository;
  notifications: NotificationRepository;
};

// Aviso é efeito de uma operação já autorizada. Quem fez a ação não recebe
// o próprio aviso, e falha aqui não desfaz a operação.
export async function notify(
  notifications: NotificationRepository | undefined,
  input: NotificationWrite,
  recipients: (string | null | undefined)[],
) {
  if (!notifications) return 0;
  const userIds = [
    ...new Set(
      recipients.filter(
        (id): id is string => Boolean(id) && id !== input.actorId,
      ),
    ),
  ];
  try {
    return await notifications.create(input, userIds);
  } catch (error) {
    console.error("notification.create", {
      workspaceId: input.workspaceId,
      type: input.type,
      error,
    });
    return 0;
  }
}

// Cada pessoa só vê os próprios avisos, no workspace aberto.
export async function listMyNotifications(
  userId: string,
  workspaceId: string,
  deps: NotificationDeps,
  limit = 50,
) {
  const membership = await requireMembership(
    userId,
    workspaceId,
    deps.workspaces,
  );
  const rows = await deps.notifications.listForUser(
    userId,
    membership.workspaceId,
    Math.min(Math.max(limit, 1), 100),
  );
  return rows.filter(
    (row) =>
      row.userId === userId && row.workspaceId === membership.workspaceId,
  );
}

export async function countMyUnread(
  userId: string,
  workspaceId: string,
  deps: NotificationDeps,
) {
  const membership = await requireMembership(
    userId,
    workspaceId,
    deps.workspaces,
  );
  return deps.notifications.countUnread(userId, membership.workspaceId);
}

export async function markMyNotificationsRead(
  userId: string,
  workspaceId: string,
  notificationId: string | null,
  deps: NotificationDeps,
  now = new Date(),
) {
  const membership = await requireMembership(
    userId,
    workspaceId,
    deps.workspaces,
  );
  return deps.notifications.markRead(
    userId,
    membership.workspaceId,
    notificationId,
    now,
  );
}
