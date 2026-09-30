import { prisma } from "./db.ts";
import type { BoardStats } from "./project-board.ts";

// Cenas prontas e checklist das gravações em aberto, por produção, em duas
// consultas para o quadro inteiro. Filtra pelo workspace além dos ids.
export async function loadBoardStats(
  workspaceId: string,
  projectIds: string[],
): Promise<BoardStats> {
  if (projectIds.length === 0) return {};
  const visible = { id: { in: projectIds }, workspaceId, deletedAt: null };
  const [scenes, items] = await Promise.all([
    prisma.scene.groupBy({
      by: ["videoProjectId"],
      where: { status: "READY", deletedAt: null, videoProject: visible },
      _count: { _all: true },
    }),
    prisma.shootChecklistItem.findMany({
      where: {
        shoot: {
          deletedAt: null,
          status: { in: ["PLANNED", "READY", "IN_PROGRESS"] },
          videoProject: visible,
        },
      },
      select: { completed: true, shoot: { select: { videoProjectId: true } } },
    }),
  ]);

  const checklists: Record<string, { done: number; total: number }> = {};
  for (const item of items) {
    const entry = (checklists[item.shoot.videoProjectId] ??= {
      done: 0,
      total: 0,
    });
    entry.total += 1;
    if (item.completed) entry.done += 1;
  }
  return {
    readyScenes: Object.fromEntries(
      scenes.map((row) => [row.videoProjectId, row._count._all]),
    ),
    checklists,
  };
}
