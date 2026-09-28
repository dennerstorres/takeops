import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import type { ProjectRepository } from "./project-repository.ts";
import type { SceneRecord, SceneRepository } from "./scene-repository.ts";
import {
  createShot,
  deleteShot,
  getShot,
  listShots,
  updateShot,
  type ShotDeps,
} from "./shot.ts";
import type { ShotRecord, ShotRepository } from "./shot-repository.ts";
import type {
  MembershipRecord,
  WorkspaceRepository,
  WorkspaceRole,
} from "./workspace-repository.ts";

function scene(id: string, videoProjectId: string): SceneRecord {
  return {
    id,
    videoProjectId,
    order: 1,
    title: id,
    description: null,
    type: "OTHER",
    speakerId: null,
    dialogue: null,
    action: null,
    estimatedDurationSeconds: null,
    cameraInstructions: null,
    editingInstructions: null,
    continuityNotes: null,
    status: "PLANNED",
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

// Só os métodos que o service de shot usa. O resto não é chamado.
function shotHarness() {
  const memberships: MembershipRecord[] = [];
  const projects = [
    { id: "p-a", workspaceId: "ws-a" },
    { id: "p-b", workspaceId: "ws-b" },
  ];
  const scenes = [
    scene("s-a", "p-a"),
    scene("s-a2", "p-a"),
    scene("s-b", "p-b"),
  ];
  const shots: ShotRecord[] = [];
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

  const sceneRepo = {
    async find(workspaceId: string, projectId: string, sceneId: string) {
      if (!findProject(workspaceId, projectId)) return null;
      return (
        scenes.find(
          (item) => item.id === sceneId && item.videoProjectId === projectId,
        ) ?? null
      );
    },
  } as unknown as SceneRepository;

  const shotRepo: ShotRepository = {
    async list(scope) {
      const found = await sceneRepo.find(
        scope.workspaceId,
        scope.projectId,
        scope.sceneId,
      );
      if (!found) return [];
      return shots
        .filter((item) => item.sceneId === found.id)
        .sort((left, right) => left.order - right.order);
    },
    async find(scope, shotId) {
      const rows = await this.list(scope);
      return rows.find((item) => item.id === shotId) ?? null;
    },
    async create(scope, input) {
      const found = await sceneRepo.find(
        scope.workspaceId,
        scope.projectId,
        scope.sceneId,
      );
      if (!found) return null;
      const order =
        shots
          .filter((item) => item.sceneId === found.id)
          .reduce((max, item) => Math.max(max, item.order), 0) + 1;
      const created: ShotRecord = {
        id: `shot-${++sequence}`,
        sceneId: found.id,
        order,
        createdAt: new Date(sequence),
        updatedAt: new Date(sequence),
        ...input,
      };
      shots.push(created);
      return created;
    },
    async update(scope, shotId, input) {
      const current = await this.find(scope, shotId);
      if (!current) return null;
      Object.assign(current, input);
      return current;
    },
    async softDelete(scope, shotId) {
      const current = await this.find(scope, shotId);
      if (!current) return false;
      shots.splice(shots.indexOf(current), 1);
      return true;
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

  const deps: ShotDeps = {
    workspaces,
    projects: projectRepo,
    scenes: sceneRepo,
    shots: shotRepo,
  };
  return { deps, shots, join };
}

describe("shot", () => {
  it("nasce planejado na próxima ordem da cena", async () => {
    const { deps, join } = shotHarness();
    join("owner", "ws-a", "OWNER");
    join("viewer", "ws-a", "VIEWER");
    const first = await createShot(
      "owner",
      "ws-a",
      "p-a",
      "s-a",
      {
        name: " Plano A ",
        cameraLabel: "Câmera frontal",
        framing: "Medium Close",
        requiredTakes: "3",
        status: "RECORDED",
        order: 7,
        sceneId: "s-b",
      },
      deps,
    );
    const second = await createShot("owner", "ws-a", "p-a", "s-a", {}, deps);
    const other = await createShot("owner", "ws-a", "p-a", "s-a2", {}, deps);

    assert.equal(first.name, "Plano A");
    assert.equal(first.status, "PLANNED");
    assert.equal(first.order, 1);
    assert.equal(first.sceneId, "s-a");
    assert.equal(first.requiredTakes, 3);
    assert.equal(first.framing, "Medium Close");
    assert.equal(second.order, 2);
    assert.equal(second.shotType, "CAMERA");
    assert.equal(second.requiredTakes, 1);
    // A ordem é contada por cena.
    assert.equal(other.order, 1);

    const listed = await listShots("viewer", "ws-a", "p-a", "s-a", deps);
    assert.deepEqual(
      listed.map((item) => item.id),
      [first.id, second.id],
    );
    const read = await getShot("viewer", "ws-a", "p-a", "s-a", first.id, deps);
    assert.equal(read.id, first.id);
  });

  it("aceita enquadramento livre e recusa takes fora do limite", async () => {
    const { deps, join } = shotHarness();
    join("owner", "ws-a", "OWNER");
    const free = await createShot(
      "owner",
      "ws-a",
      "p-a",
      "s-a",
      { framing: "Plongée bem aberto", shotType: "BROLL" },
      deps,
    );
    assert.equal(free.framing, "Plongée bem aberto");
    assert.equal(free.shotType, "BROLL");

    for (const requiredTakes of ["0", "100", "1.5", "abc"]) {
      await assert.rejects(
        createShot("owner", "ws-a", "p-a", "s-a", { requiredTakes }, deps),
        ValidationError,
      );
    }
    await assert.rejects(
      createShot("owner", "ws-a", "p-a", "s-a", { shotType: "DRONE" }, deps),
      ValidationError,
    );
  });

  it("leitor não cria e ninguém alcança cena de outro workspace", async () => {
    const { deps, join, shots } = shotHarness();
    join("owner", "ws-a", "OWNER");
    join("viewer", "ws-a", "VIEWER");
    join("stranger", "ws-b", "OWNER");

    await assert.rejects(
      createShot("viewer", "ws-a", "p-a", "s-a", {}, deps),
      ForbiddenError,
    );
    // Cena de outra produção, mesmo com o id certo.
    await assert.rejects(
      createShot("owner", "ws-a", "p-a", "s-b", {}, deps),
      NotFoundError,
    );
    await assert.rejects(
      createShot("owner", "ws-a", "p-b", "s-b", {}, deps),
      NotFoundError,
    );
    await assert.rejects(
      listShots("stranger", "ws-a", "p-a", "s-a", deps),
      ForbiddenError,
    );
    assert.equal(shots.length, 0);

    const own = await createShot("owner", "ws-a", "p-a", "s-a", {}, deps);
    await assert.rejects(
      getShot("owner", "ws-a", "p-a", "s-a2", own.id, deps),
      NotFoundError,
    );
  });

  it("edita os campos e o status sem mexer na ordem e esconde ao excluir", async () => {
    const { deps, join } = shotHarness();
    join("owner", "ws-a", "OWNER");
    join("viewer", "ws-a", "VIEWER");
    const first = await createShot("owner", "ws-a", "p-a", "s-a", {}, deps);
    const second = await createShot("owner", "ws-a", "p-a", "s-a", {}, deps);

    const edited = await updateShot(
      "owner",
      "ws-a",
      "p-a",
      "s-a",
      second.id,
      {
        name: "Close lateral",
        framing: "Close",
        requiredTakes: 2,
        status: "NEEDS_RETAKE",
        order: 1,
        sceneId: "s-a2",
      },
      deps,
    );
    assert.equal(edited.name, "Close lateral");
    assert.equal(edited.status, "NEEDS_RETAKE");
    assert.equal(edited.requiredTakes, 2);
    assert.equal(edited.order, 2);
    assert.equal(edited.sceneId, "s-a");

    // Sem status no envio, o status atual continua.
    const kept = await updateShot(
      "owner",
      "ws-a",
      "p-a",
      "s-a",
      second.id,
      { name: "Close" },
      deps,
    );
    assert.equal(kept.status, "NEEDS_RETAKE");
    await assert.rejects(
      updateShot(
        "owner",
        "ws-a",
        "p-a",
        "s-a",
        second.id,
        { status: "DONE" },
        deps,
      ),
      ValidationError,
    );

    await assert.rejects(
      updateShot("viewer", "ws-a", "p-a", "s-a", first.id, {}, deps),
      ForbiddenError,
    );
    await assert.rejects(
      deleteShot("viewer", "ws-a", "p-a", "s-a", first.id, deps),
      ForbiddenError,
    );
    // O shot não é alcançado por outra cena.
    await assert.rejects(
      updateShot("owner", "ws-a", "p-a", "s-a2", first.id, {}, deps),
      NotFoundError,
    );
    await assert.rejects(
      deleteShot("owner", "ws-a", "p-a", "s-a2", first.id, deps),
      NotFoundError,
    );

    await deleteShot("owner", "ws-a", "p-a", "s-a", first.id, deps);
    const listed = await listShots("owner", "ws-a", "p-a", "s-a", deps);
    assert.deepEqual(
      listed.map((item) => item.id),
      [second.id],
    );
    await assert.rejects(
      getShot("owner", "ws-a", "p-a", "s-a", first.id, deps),
      NotFoundError,
    );
  });
});
