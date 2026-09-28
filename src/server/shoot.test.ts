import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import type { ProjectRepository } from "./project-repository.ts";
import { createShoot, getShoot, listShoots, type ShootDeps } from "./shoot.ts";
import type { ShootRecord, ShootRepository } from "./shoot-repository.ts";
import type {
  MembershipRecord,
  WorkspaceRepository,
  WorkspaceRole,
} from "./workspace-repository.ts";

// Só os métodos que o service de gravação usa.
function shootHarness() {
  const memberships: MembershipRecord[] = [];
  const projects = [
    { id: "p-a", workspaceId: "ws-a" },
    { id: "p-a2", workspaceId: "ws-a" },
    { id: "p-b", workspaceId: "ws-b" },
  ];
  const shoots: ShootRecord[] = [];
  let sequence = 0;

  const findProject = (workspaceId: string, projectId: string) =>
    projects.find(
      (item) => item.id === projectId && item.workspaceId === workspaceId,
    ) ?? null;

  const workspaces = {
    async findMembership(userId: string, workspaceId: string) {
      return (
        memberships.find(
          (item) => item.userId === userId && item.workspaceId === workspaceId,
        ) ?? null
      );
    },
  } as unknown as WorkspaceRepository;

  const projectRepo = {
    async find(workspaceId: string, projectId: string) {
      return findProject(workspaceId, projectId);
    },
  } as unknown as ProjectRepository;

  const shootRepo: ShootRepository = {
    async list(workspaceId, projectId) {
      if (!findProject(workspaceId, projectId)) return [];
      return shoots
        .filter((item) => item.videoProjectId === projectId)
        .sort(
          (left, right) =>
            left.scheduledAt.getTime() - right.scheduledAt.getTime(),
        );
    },
    async find(workspaceId, projectId, shootId) {
      const rows = await this.list(workspaceId, projectId);
      return rows.find((item) => item.id === shootId) ?? null;
    },
    async create(workspaceId, projectId, input) {
      if (!findProject(workspaceId, projectId)) return null;
      const created: ShootRecord = {
        id: `shoot-${++sequence}`,
        videoProjectId: projectId,
        createdAt: new Date(sequence),
        updatedAt: new Date(sequence),
        ...input,
      };
      shoots.push(created);
      return created;
    },
  };

  function join(userId: string, workspaceId: string, role: WorkspaceRole) {
    memberships.push({
      id: `${workspaceId}-${userId}`,
      workspaceId,
      userId,
      role,
      createdAt: new Date(),
    });
  }

  const deps: ShootDeps = {
    workspaces,
    projects: projectRepo,
    shoots: shootRepo,
  };
  return { deps, shoots, join };
}

describe("gravação", () => {
  it("nasce planejada, guarda UTC e lista por data", async () => {
    const { deps, join } = shootHarness();
    join("owner", "ws-a", "OWNER");
    join("viewer", "ws-a", "VIEWER");
    const later = await createShoot(
      "owner",
      "ws-a",
      "p-a",
      {
        title: " Estúdio ",
        scheduledAt: "2026-10-06T10:00:00-04:00",
        endAt: "2026-10-06T12:00:00-04:00",
        location: "Sala 2",
        status: "COMPLETED",
        videoProjectId: "p-b",
      },
      deps,
    );
    const sooner = await createShoot(
      "owner",
      "ws-a",
      "p-a",
      { scheduledAt: "2026-10-05T13:00:00Z" },
      deps,
    );

    assert.equal(later.title, "Estúdio");
    assert.equal(later.status, "PLANNED");
    assert.equal(later.videoProjectId, "p-a");
    assert.equal(later.scheduledAt.toISOString(), "2026-10-06T14:00:00.000Z");
    assert.equal(later.endAt?.toISOString(), "2026-10-06T16:00:00.000Z");
    assert.equal(sooner.endAt, null);

    // Uma produção pode ter várias sessões.
    const listed = await listShoots("viewer", "ws-a", "p-a", deps);
    assert.deepEqual(
      listed.map((item) => item.id),
      [sooner.id, later.id],
    );
    const read = await getShoot("viewer", "ws-a", "p-a", later.id, deps);
    assert.equal(read.id, later.id);
  });

  it("exige data com fuso e fim depois do início", async () => {
    const { deps, join } = shootHarness();
    join("owner", "ws-a", "OWNER");
    for (const input of [
      {},
      { scheduledAt: "2026-10-05T10:00" },
      { scheduledAt: "2026-10-05" },
      { scheduledAt: "amanhã" },
      {
        scheduledAt: "2026-10-05T10:00:00Z",
        endAt: "2026-10-05T09:59:00Z",
      },
    ]) {
      await assert.rejects(
        createShoot("owner", "ws-a", "p-a", input, deps),
        ValidationError,
      );
    }
  });

  it("leitor não cria e outro workspace não alcança", async () => {
    const { deps, join, shoots } = shootHarness();
    join("owner", "ws-a", "OWNER");
    join("viewer", "ws-a", "VIEWER");
    join("stranger", "ws-b", "OWNER");
    const input = { scheduledAt: "2026-10-05T13:00:00Z" };

    await assert.rejects(
      createShoot("viewer", "ws-a", "p-a", input, deps),
      ForbiddenError,
    );
    await assert.rejects(
      createShoot("owner", "ws-a", "p-b", input, deps),
      NotFoundError,
    );
    await assert.rejects(
      listShoots("stranger", "ws-a", "p-a", deps),
      ForbiddenError,
    );
    assert.equal(shoots.length, 0);

    const own = await createShoot("owner", "ws-a", "p-a", input, deps);
    await assert.rejects(
      getShoot("owner", "ws-a", "p-a2", own.id, deps),
      NotFoundError,
    );
  });
});
