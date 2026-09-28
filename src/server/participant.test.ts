import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import {
  addParticipant,
  listParticipants,
  removeParticipant,
} from "./participant.ts";
import type {
  ParticipantRecord,
  ParticipantRepository,
} from "./participant-repository.ts";
import type { ProjectRecord, ProjectRepository } from "./project-repository.ts";
import type {
  MembershipRecord,
  WorkspaceRepository,
  WorkspaceRole,
} from "./workspace-repository.ts";

function harness() {
  const memberships: MembershipRecord[] = [];
  const projects: ProjectRecord[] = [];
  const rows: ParticipantRecord[] = [];
  const names = new Map<string, string>();

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

  const participants: ParticipantRepository = {
    async list(projectId) {
      return rows.filter((row) => row.videoProjectId === projectId);
    },
    async listByProjectIds(projectIds) {
      return rows.filter((row) => projectIds.includes(row.videoProjectId));
    },
    async add(projectId, userId, role) {
      const row: ParticipantRecord = {
        id: `${projectId}-${userId}-${role}`,
        videoProjectId: projectId,
        userId,
        name: names.get(userId) ?? null,
        email: null,
        role,
        createdAt: new Date(),
      };
      rows.push(row);
      return row;
    },
    async remove(projectId, userId, role) {
      const index = rows.findIndex(
        (row) =>
          row.videoProjectId === projectId &&
          row.userId === userId &&
          row.role === role,
      );
      if (index < 0) return false;
      rows.splice(index, 1);
      return true;
    },
  };

  function join(
    userId: string,
    workspaceId: string,
    role: WorkspaceRole,
    name: string,
  ) {
    names.set(userId, name);
    memberships.push({
      id: `${workspaceId}-${userId}`,
      workspaceId,
      userId,
      role,
      createdAt: new Date(),
    });
  }

  function project(id: string, workspaceId: string) {
    projects.push({
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
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return { workspaces, projectRepo, participants, join, project };
}

describe("participantes", () => {
  it("permite várias funções e recusa função repetida, leitor e gente de fora", async () => {
    const { workspaces, projectRepo, participants, join, project } = harness();
    join("owner", "ws-a", "OWNER", "Dono");
    join("camera", "ws-a", "MEMBER", "Câmera");
    join("viewer", "ws-a", "VIEWER", "Leitor");
    join("outsider", "ws-b", "OWNER", "Fora");
    project("proj-a", "ws-a");

    const producer = await addParticipant(
      "owner",
      "ws-a",
      "proj-a",
      { userId: "camera", role: "CAMERA" },
      workspaces,
      projectRepo,
      participants,
    );
    const editor = await addParticipant(
      "owner",
      "ws-a",
      "proj-a",
      { userId: "camera", role: "EDITOR" },
      workspaces,
      projectRepo,
      participants,
    );
    assert.equal(producer.role, "CAMERA");
    assert.equal(editor.role, "EDITOR");

    await assert.rejects(
      () =>
        addParticipant(
          "owner",
          "ws-a",
          "proj-a",
          { userId: "camera", role: "CAMERA" },
          workspaces,
          projectRepo,
          participants,
        ),
      (error: unknown) =>
        error instanceof ValidationError && error.fields.role !== undefined,
    );
    await assert.rejects(
      () =>
        addParticipant(
          "owner",
          "ws-a",
          "proj-a",
          { userId: "outsider", role: "PRODUCER" },
          workspaces,
          projectRepo,
          participants,
        ),
      (error: unknown) =>
        error instanceof ValidationError && error.fields.userId !== undefined,
    );
    await assert.rejects(
      () =>
        addParticipant(
          "viewer",
          "ws-a",
          "proj-a",
          { userId: "camera", role: "REVIEWER" },
          workspaces,
          projectRepo,
          participants,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );
    await assert.rejects(
      () =>
        addParticipant(
          "outsider",
          "ws-a",
          "proj-a",
          { userId: "camera", role: "REVIEWER" },
          workspaces,
          projectRepo,
          participants,
        ),
      (error: unknown) => error instanceof ForbiddenError,
    );
    await assert.rejects(
      () =>
        addParticipant(
          "owner",
          "ws-a",
          "proj-a",
          { userId: "camera", role: "CHEFE" },
          workspaces,
          projectRepo,
          participants,
        ),
      (error: unknown) => error instanceof ValidationError,
    );

    const listed = await listParticipants(
      "viewer",
      "ws-a",
      "proj-a",
      workspaces,
      projectRepo,
      participants,
    );
    assert.deepEqual(
      listed.map((row) => row.role),
      ["CAMERA", "EDITOR"],
    );

    await removeParticipant(
      "owner",
      "ws-a",
      "proj-a",
      { userId: "camera", role: "CAMERA" },
      workspaces,
      projectRepo,
      participants,
    );
    const after = await listParticipants(
      "owner",
      "ws-a",
      "proj-a",
      workspaces,
      projectRepo,
      participants,
    );
    assert.deepEqual(
      after.map((row) => row.role),
      ["EDITOR"],
    );
    await assert.rejects(
      () =>
        listParticipants(
          "outsider",
          "ws-b",
          "proj-a",
          workspaces,
          projectRepo,
          participants,
        ),
      (error: unknown) => error instanceof NotFoundError,
    );
  });
});
