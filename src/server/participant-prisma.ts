import { prisma } from "./db.ts";
import type { ProjectRole } from "./participant-labels.ts";
import type {
  ParticipantRecord,
  ParticipantRepository,
} from "./participant-repository.ts";

function mapRow(row: {
  id: string;
  videoProjectId: string;
  userId: string;
  role: ProjectRole;
  createdAt: Date;
  user: { name: string | null; email: string | null };
}): ParticipantRecord {
  return {
    id: row.id,
    videoProjectId: row.videoProjectId,
    userId: row.userId,
    name: row.user.name,
    email: row.user.email,
    role: row.role,
    createdAt: row.createdAt,
  };
}

export const prismaParticipantRepository: ParticipantRepository = {
  async listByProjectIds(projectIds) {
    if (projectIds.length === 0) return [];
    const rows = await prisma.projectMember.findMany({
      where: { videoProjectId: { in: projectIds } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: [{ createdAt: "asc" }, { role: "asc" }],
    });
    return rows.map(mapRow);
  },

  async list(projectId) {
    const rows = await prisma.projectMember.findMany({
      where: { videoProjectId: projectId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: [{ createdAt: "asc" }, { role: "asc" }],
    });
    return rows.map(mapRow);
  },

  async add(projectId, userId, role) {
    const row = await prisma.projectMember.create({
      data: { videoProjectId: projectId, userId, role },
      include: { user: { select: { name: true, email: true } } },
    });
    return mapRow(row);
  },

  async remove(projectId, userId, role) {
    const removed = await prisma.projectMember.deleteMany({
      where: { videoProjectId: projectId, userId, role },
    });
    return removed.count === 1;
  },
};
