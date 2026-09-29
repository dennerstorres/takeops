import type { NotificationType } from "./notification-labels.ts";

export type NotificationMetadata = Record<
  string,
  string | number | boolean | null
>;

export type NotificationRecord = {
  id: string;
  workspaceId: string;
  userId: string;
  actorId: string | null;
  videoProjectId: string | null;
  projectTitle: string | null;
  type: NotificationType;
  metadata: NotificationMetadata | null;
  readAt: Date | null;
  createdAt: Date;
};

export type NotificationWrite = {
  workspaceId: string;
  actorId: string | null;
  videoProjectId: string | null;
  type: NotificationType;
  metadata: NotificationMetadata | null;
};

export type NotificationRepository = {
  // Um aviso por destinatário. Só entram membros do workspace.
  create(input: NotificationWrite, userIds: string[]): Promise<number>;
  listForUser(
    userId: string,
    workspaceId: string,
    limit: number,
  ): Promise<NotificationRecord[]>;
  countUnread(userId: string, workspaceId: string): Promise<number>;
  // null marca todas; devolve quantas mudaram.
  markRead(
    userId: string,
    workspaceId: string,
    notificationId: string | null,
    at: Date,
  ): Promise<number>;
};
