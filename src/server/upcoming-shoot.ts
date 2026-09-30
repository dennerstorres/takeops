import { notify } from "./notification.ts";
import type { NotificationRepository } from "./notification-repository.ts";
import type { ParticipantRepository } from "./participant-repository.ts";

export type UpcomingShoot = {
  id: string;
  title: string | null;
  workspaceId: string;
  videoProjectId: string;
  ownerId: string | null;
};

export type UpcomingShootRepository = {
  // Marca e devolve, numa só operação, as gravações da janela ainda sem aviso.
  // Duas execuções ao mesmo tempo não pegam a mesma gravação.
  claim(from: Date, to: Date, now: Date): Promise<UpcomingShoot[]>;
};

export type UpcomingShootDeps = {
  shoots: UpcomingShootRepository;
  participants: ParticipantRepository;
  notifications: NotificationRepository;
};

export const upcomingShootHours = 24;

// Aviso de gravação próxima (spec §40), chamado pela rota de cron. Roda sem
// usuário: a rota só autoriza pelo CRON_SECRET, e cada aviso fica no
// workspace da própria gravação.
export async function notifyUpcomingShoots(
  deps: UpcomingShootDeps,
  now = new Date(),
) {
  const to = new Date(now.getTime() + upcomingShootHours * 3_600_000);
  const shoots = await deps.shoots.claim(now, to, now);
  if (shoots.length === 0) return { shoots: 0, notifications: 0 };

  const participants = await deps.participants.listByProjectIds([
    ...new Set(shoots.map((shoot) => shoot.videoProjectId)),
  ]);
  let notifications = 0;
  for (const shoot of shoots) {
    const audience = [
      shoot.ownerId,
      ...participants
        .filter((row) => row.videoProjectId === shoot.videoProjectId)
        .map((row) => row.userId),
    ];
    notifications += await notify(
      deps.notifications,
      {
        workspaceId: shoot.workspaceId,
        actorId: null,
        videoProjectId: shoot.videoProjectId,
        type: "SHOOT_UPCOMING",
        metadata: { shootId: shoot.id, shoot: shoot.title },
      },
      audience,
    );
  }
  return { shoots: shoots.length, notifications };
}
