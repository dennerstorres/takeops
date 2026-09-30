import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import type { ProjectRecord, ProjectRepository } from "./project-repository.ts";
import {
  createScene,
  deleteScene,
  duplicateScene,
  getScene,
  listScenes,
  reorderScenes,
  setSceneRecordingStatus,
  updateScene,
} from "./scene.ts";
import type { SceneRecord, SceneRepository } from "./scene-repository.ts";
import type {
  MembershipRecord,
  WorkspaceRepository,
  WorkspaceRole,
} from "./workspace-repository.ts";

function project(id: string, workspaceId: string): ProjectRecord {
  return {
    id,
    workspaceId,
    title: id,
    slug: null,
    description: null,
    objective: null,
    audience: null,
    product: null,
    format: "DEMO",
    aspectRatio: "NINE_SIXTEEN",
    estimatedDurationSeconds: null,
    status: "IDEA",
    priority: "NORMAL",
    thumbnailUrl: null,
    ownerId: null,
    plannedShootDate: null,
    plannedPublishDate: null,
    sourceIdeaId: null,
    createdById: "owner",
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-01T00:00:00.000Z"),
  };
}

function harness() {
  const memberships: MembershipRecord[] = [];
  const projects = [project("p-a", "ws-a"), project("p-b", "ws-b")];
  const scenes: SceneRecord[] = [];
  let sequence = 0;

  const workspaces: WorkspaceRepository = {
    async createWorkspaceWithOwner() {
      throw new Error("não usado");
    },
    async findMembership(userId, workspaceId) {
      return (
        memberships.find(
          (item) => item.userId === userId && item.workspaceId === workspaceId,
        ) ?? null
      );
    },
    async findWorkspace() {
      return null;
    },
    async listForUser() {
      return [];
    },
    async listMembers() {
      return [];
    },
    async updateMemberRole() {
      throw new Error("não usado");
    },
    async removeMember() {
      return false;
    },
  };

  const projectRepo: ProjectRepository = {
    async list() {
      return [];
    },
    async find(workspaceId, projectId) {
      return (
        projects.find(
          (item) => item.id === projectId && item.workspaceId === workspaceId,
        ) ?? null
      );
    },
    async findBySlug() {
      return null;
    },
    async create() {
      throw new Error("não usado");
    },
    async update() {
      return null;
    },
    async setStatus() {
      return null;
    },
    async softDelete() {
      return false;
    },
    async findBySourceIdea() {
      return null;
    },
    async convert() {
      throw new Error("não usado");
    },
  };

  const sceneRepo: SceneRepository = {
    async list(workspaceId, projectId) {
      const project = projects.find(
        (item) => item.id === projectId && item.workspaceId === workspaceId,
      );
      if (!project) return [];
      return scenes
        .filter((item) => item.videoProjectId === project.id)
        .sort((left, right) => left.order - right.order);
    },
    async find(workspaceId, projectId, sceneId) {
      const rows = await this.list(workspaceId, projectId);
      return rows.find((item) => item.id === sceneId) ?? null;
    },
    async create(workspaceId, projectId, input) {
      const project = projects.find(
        (item) => item.id === projectId && item.workspaceId === workspaceId,
      );
      if (!project) return null;
      const order =
        scenes
          .filter((item) => item.videoProjectId === project.id)
          .reduce((max, item) => Math.max(max, item.order), 0) + 1;
      const created: SceneRecord = {
        id: `scene-${++sequence}`,
        videoProjectId: project.id,
        order,
        createdAt: new Date(sequence),
        updatedAt: new Date(sequence),
        ...input,
      };
      scenes.push(created);
      return created;
    },
    async update(workspaceId, projectId, sceneId, input) {
      const current = await this.find(workspaceId, projectId, sceneId);
      if (!current) return null;
      Object.assign(current, input);
      return current;
    },
    async softDelete(workspaceId, projectId, sceneId) {
      const index = scenes.findIndex(
        (item) => item.id === sceneId && item.videoProjectId === projectId,
      );
      const project = projects.find(
        (item) => item.id === projectId && item.workspaceId === workspaceId,
      );
      if (!project || index < 0) return false;
      scenes.splice(index, 1);
      return true;
    },
    async reorder(workspaceId, projectId, orderedIds) {
      const project = projects.find(
        (item) => item.id === projectId && item.workspaceId === workspaceId,
      );
      if (!project) return null;
      const visible = scenes
        .filter((item) => item.videoProjectId === project.id)
        .sort((left, right) => left.order - right.order);
      const unique = new Set(orderedIds);
      if (
        orderedIds.length !== visible.length ||
        unique.size !== orderedIds.length ||
        orderedIds.some((id) => !visible.some((item) => item.id === id))
      ) {
        return null;
      }
      for (let index = 0; index < orderedIds.length; index += 1) {
        const scene = visible.find((item) => item.id === orderedIds[index]);
        if (!scene) return null;
        scene.order = index + 1;
      }
      return orderedIds.map(
        (id) => visible.find((item) => item.id === id) as SceneRecord,
      );
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

  return { workspaces, projectRepo, sceneRepo, join };
}

describe("cena", () => {
  it("nasce planejada, na próxima ordem, e não aceita gente de fora", async () => {
    const { workspaces, projectRepo, sceneRepo, join } = harness();
    join("owner", "ws-a", "OWNER");
    join("ana", "ws-a", "MEMBER");
    join("viewer", "ws-a", "VIEWER");
    const first = await createScene(
      "owner",
      "ws-a",
      "p-a",
      {
        title: " Abertura ",
        type: "HOOK",
        speakerId: "ana",
        status: "READY",
        order: 9,
        workspaceId: "ws-b",
      },
      workspaces,
      projectRepo,
      sceneRepo,
    );
    const second = await createScene(
      "owner",
      "ws-a",
      "p-a",
      { title: "Produto", type: "PRODUCT" },
      workspaces,
      projectRepo,
      sceneRepo,
    );
    assert.equal(first.status, "PLANNED");
    assert.equal(first.order, 1);
    assert.equal(first.title, "Abertura");
    assert.equal(first.speakerId, "ana");
    assert.equal(first.videoProjectId, "p-a");
    assert.equal(second.order, 2);

    const listed = await listScenes(
      "viewer",
      "ws-a",
      "p-a",
      workspaces,
      projectRepo,
      sceneRepo,
    );
    assert.deepEqual(
      listed.map((item) => item.id),
      [first.id, second.id],
    );
    const read = await getScene(
      "viewer",
      "ws-a",
      "p-a",
      first.id,
      workspaces,
      projectRepo,
      sceneRepo,
    );
    assert.equal(read.id, first.id);

    await assert.rejects(
      () =>
        createScene(
          "viewer",
          "ws-a",
          "p-a",
          { title: "Não", type: "OTHER" },
          workspaces,
          projectRepo,
          sceneRepo,
        ),
      ForbiddenError,
    );
    await assert.rejects(
      () =>
        createScene(
          "owner",
          "ws-a",
          "p-a",
          { title: "Fora", type: "OTHER", speakerId: "outsider" },
          workspaces,
          projectRepo,
          sceneRepo,
        ),
      ValidationError,
    );
    await assert.rejects(
      () =>
        listScenes(
          "outsider",
          "ws-a",
          "p-a",
          workspaces,
          projectRepo,
          sceneRepo,
        ),
      ForbiddenError,
    );
    await assert.rejects(
      () =>
        getScene(
          "owner",
          "ws-a",
          "p-b",
          first.id,
          workspaces,
          projectRepo,
          sceneRepo,
        ),
      NotFoundError,
    );
  });

  it("edita os campos, troca o status e esconde a exclusão sem mudar a ordem", async () => {
    const { workspaces, projectRepo, sceneRepo, join } = harness();
    join("owner", "ws-a", "OWNER");
    join("viewer", "ws-a", "VIEWER");
    const created = await createScene(
      "owner",
      "ws-a",
      "p-a",
      { title: "Abertura", type: "HOOK", dialogue: "Olá" },
      workspaces,
      projectRepo,
      sceneRepo,
    );
    const updated = await updateScene(
      "owner",
      "ws-a",
      "p-a",
      created.id,
      { title: "Abertura nova", type: "DIALOGUE", status: "READY", order: 4 },
      workspaces,
      projectRepo,
      sceneRepo,
    );
    assert.equal(updated.title, "Abertura nova");
    assert.equal(updated.status, "READY");
    assert.equal(updated.order, 1);
    assert.equal(updated.dialogue, null);
    await assert.rejects(
      () =>
        updateScene(
          "viewer",
          "ws-a",
          "p-a",
          created.id,
          { title: "Não", type: "OTHER" },
          workspaces,
          projectRepo,
          sceneRepo,
        ),
      ForbiddenError,
    );
    await deleteScene(
      "owner",
      "ws-a",
      "p-a",
      created.id,
      workspaces,
      projectRepo,
      sceneRepo,
    );
    assert.deepEqual(
      await listScenes(
        "owner",
        "ws-a",
        "p-a",
        workspaces,
        projectRepo,
        sceneRepo,
      ),
      [],
    );
    await assert.rejects(
      () =>
        getScene(
          "owner",
          "ws-a",
          "p-a",
          created.id,
          workspaces,
          projectRepo,
          sceneRepo,
        ),
      NotFoundError,
    );
  });

  it("no set marca gravada ou refazer sem tocar no resto da cena", async () => {
    const { workspaces, projectRepo, sceneRepo, join } = harness();
    join("owner", "ws-a", "OWNER");
    join("member", "ws-a", "MEMBER");
    join("viewer", "ws-a", "VIEWER");
    const created = await createScene(
      "owner",
      "ws-a",
      "p-a",
      { title: "Abertura", type: "HOOK", dialogue: "Olá" },
      workspaces,
      projectRepo,
      sceneRepo,
    );
    const recorded = await setSceneRecordingStatus(
      "member",
      "ws-a",
      "p-a",
      created.id,
      { status: "RECORDED", title: "Ignorado" },
      workspaces,
      projectRepo,
      sceneRepo,
    );
    assert.equal(recorded.status, "RECORDED");
    assert.equal(recorded.title, "Abertura");
    assert.equal(recorded.dialogue, "Olá");
    const retake = await setSceneRecordingStatus(
      "member",
      "ws-a",
      "p-a",
      created.id,
      { status: "NEEDS_RETAKE" },
      workspaces,
      projectRepo,
      sceneRepo,
    );
    assert.equal(retake.status, "NEEDS_RETAKE");
    await assert.rejects(
      () =>
        setSceneRecordingStatus(
          "member",
          "ws-a",
          "p-a",
          created.id,
          { status: "DISCARDED" },
          workspaces,
          projectRepo,
          sceneRepo,
        ),
      ValidationError,
    );
    await assert.rejects(
      () =>
        setSceneRecordingStatus(
          "viewer",
          "ws-a",
          "p-a",
          created.id,
          { status: "RECORDED" },
          workspaces,
          projectRepo,
          sceneRepo,
        ),
      ForbiddenError,
    );
    await assert.rejects(
      () =>
        setSceneRecordingStatus(
          "owner",
          "ws-a",
          "p-b",
          created.id,
          { status: "RECORDED" },
          workspaces,
          projectRepo,
          sceneRepo,
        ),
      NotFoundError,
    );
  });

  it("reordena todas as cenas visíveis e recusa lista incompleta", async () => {
    const { workspaces, projectRepo, sceneRepo, join } = harness();
    join("owner", "ws-a", "OWNER");
    join("viewer", "ws-a", "VIEWER");
    const first = await createScene(
      "owner",
      "ws-a",
      "p-a",
      { title: "Um", type: "HOOK" },
      workspaces,
      projectRepo,
      sceneRepo,
    );
    const second = await createScene(
      "owner",
      "ws-a",
      "p-a",
      { title: "Dois", type: "PRODUCT" },
      workspaces,
      projectRepo,
      sceneRepo,
    );
    const moved = await reorderScenes(
      "owner",
      "ws-a",
      "p-a",
      { sceneIds: [second.id, first.id] },
      workspaces,
      projectRepo,
      sceneRepo,
    );
    assert.deepEqual(
      moved.map((item) => [item.id, item.order]),
      [
        [second.id, 1],
        [first.id, 2],
      ],
    );
    await assert.rejects(
      () =>
        reorderScenes(
          "viewer",
          "ws-a",
          "p-a",
          { sceneIds: [first.id, second.id] },
          workspaces,
          projectRepo,
          sceneRepo,
        ),
      ForbiddenError,
    );
    await assert.rejects(
      () =>
        reorderScenes(
          "owner",
          "ws-a",
          "p-a",
          { sceneIds: [first.id] },
          workspaces,
          projectRepo,
          sceneRepo,
        ),
      ValidationError,
    );
  });

  it("copia a cena para o fim e nasce planejada", async () => {
    const { workspaces, projectRepo, sceneRepo, join } = harness();
    join("owner", "ws-a", "OWNER");
    join("ana", "ws-a", "MEMBER");
    join("viewer", "ws-a", "VIEWER");
    const original = await createScene(
      "owner",
      "ws-a",
      "p-a",
      { title: "Abertura", type: "HOOK", speakerId: "ana", dialogue: "Olá" },
      workspaces,
      projectRepo,
      sceneRepo,
    );
    await updateScene(
      "owner",
      "ws-a",
      "p-a",
      original.id,
      {
        title: "Abertura",
        type: "HOOK",
        speakerId: "ana",
        dialogue: "Olá",
        status: "RECORDED",
      },
      workspaces,
      projectRepo,
      sceneRepo,
    );
    const copy = await duplicateScene(
      "owner",
      "ws-a",
      "p-a",
      original.id,
      workspaces,
      projectRepo,
      sceneRepo,
    );
    assert.notEqual(copy.id, original.id);
    assert.equal(copy.title, "Abertura");
    assert.equal(copy.type, "HOOK");
    assert.equal(copy.dialogue, "Olá");
    assert.equal(copy.speakerId, "ana");
    assert.equal(copy.status, "PLANNED");
    assert.equal(copy.order, 2);
    assert.equal(copy.videoProjectId, "p-a");
    await assert.rejects(
      () =>
        duplicateScene(
          "viewer",
          "ws-a",
          "p-a",
          original.id,
          workspaces,
          projectRepo,
          sceneRepo,
        ),
      ForbiddenError,
    );
  });
});
