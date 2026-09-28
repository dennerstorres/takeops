import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenError } from "./errors.ts";
import type { ParticipantRepository } from "./participant-repository.ts";
import { searchProjects } from "./project.ts";
import type { ProjectRecord, ProjectRepository } from "./project-repository.ts";
import {
  emptySearch,
  filterProjects,
  parseProjectSearch,
} from "./project-search.ts";
import type {
  MembershipRecord,
  WorkspaceRepository,
} from "./workspace-repository.ts";

function project(
  overrides: Partial<ProjectRecord> & Pick<ProjectRecord, "id" | "workspaceId">,
): ProjectRecord {
  return {
    title: "Sem título",
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
    ...overrides,
  };
}

function harness(rows: ProjectRecord[]) {
  const memberships: MembershipRecord[] = [
    {
      id: "m-1",
      userId: "owner",
      workspaceId: "ws-a",
      role: "OWNER",
      createdAt: new Date("2026-09-01T00:00:00.000Z"),
    },
    {
      id: "m-2",
      userId: "viewer",
      workspaceId: "ws-a",
      role: "VIEWER",
      createdAt: new Date("2026-09-02T00:00:00.000Z"),
    },
  ];
  const members: { videoProjectId: string; userId: string }[] = [];
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
  const projects: ProjectRepository = {
    async list(workspaceId) {
      return rows.filter((item) => item.workspaceId === workspaceId);
    },
    async find() {
      return null;
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
    async setStatus() {
      return null;
    },
    async findBySourceIdea() {
      return null;
    },
    async convert() {
      throw new Error("não usado");
    },
  };
  const participants: ParticipantRepository = {
    async listByProjectIds(projectIds) {
      const allowed = new Set(projectIds);
      return members
        .filter((item) => allowed.has(item.videoProjectId))
        .map((item) => ({
          id: `${item.videoProjectId}-${item.userId}`,
          videoProjectId: item.videoProjectId,
          userId: item.userId,
          name: null,
          email: null,
          role: "EDITOR" as const,
          createdAt: new Date("2026-09-01T00:00:00.000Z"),
        }));
    },
    async list() {
      return [];
    },
    async add() {
      throw new Error("não usado");
    },
    async remove() {
      return false;
    },
  };
  return { workspaces, projects, participants, members };
}

const catalog = [
  project({
    id: "p1",
    workspaceId: "ws-a",
    title: "Ação de Lançamento",
    status: "EDITING",
    priority: "HIGH",
    ownerId: "ana",
    product: "Creme solar",
    plannedShootDate: new Date("2026-10-01T00:00:00.000Z"),
    plannedPublishDate: new Date("2026-10-10T00:00:00.000Z"),
  }),
  project({
    id: "p2",
    workspaceId: "ws-a",
    title: "Bastidores",
    status: "IDEA",
    priority: "LOW",
    ownerId: "bia",
    product: "Outro item",
    plannedShootDate: new Date("2026-09-30T00:00:00.000Z"),
    plannedPublishDate: null,
  }),
  project({
    id: "p3",
    workspaceId: "ws-a",
    title: "Sem data",
    status: "EDITING",
    priority: "HIGH",
    ownerId: "ana",
    product: "Creme solar",
  }),
  project({
    id: "foreign",
    workspaceId: "ws-b",
    title: "Ação de Lançamento",
    status: "EDITING",
    priority: "HIGH",
    ownerId: "ana",
    product: "Creme solar",
  }),
];

describe("parseProjectSearch", () => {
  it("lê o primeiro valor e ignora o que não veio", () => {
    const query = parseProjectSearch({
      q: ["  ação  ", "outro"],
      status: "EDITING",
      shootFrom: "2026-10-01",
    });
    assert.equal(query.text, "ação");
    assert.equal(query.status, "EDITING");
    assert.equal(query.shootFrom, "2026-10-01");
    assert.equal(query.ownerId, "");
  });
});

describe("filterProjects", () => {
  const participants = [
    { videoProjectId: "p1", userId: "caio" },
    { videoProjectId: "p2", userId: "davi" },
  ];

  it("combina os filtros e ignora status ou prioridade desconhecidos", () => {
    const matched = filterProjects(catalog, participants, {
      ...emptySearch,
      text: "AÇÃO",
      status: "EDITING",
      ownerId: "ana",
      participantId: "caio",
      product: "creme",
      priority: "HIGH",
      shootFrom: "2026-10-01",
      shootTo: "2026-10-02",
      publishFrom: "2026-10-10",
      publishTo: "2026-10-10",
    });
    assert.deepEqual(
      matched.map((item) => item.id),
      ["p1"],
    );

    assert.deepEqual(
      filterProjects(catalog, participants, {
        ...emptySearch,
        status: "NOPE",
      }).map((item) => item.id),
      [],
    );
    assert.deepEqual(
      filterProjects(catalog, participants, {
        ...emptySearch,
        priority: "MEH",
      }).map((item) => item.id),
      [],
    );
  });

  it("exclui data vazia quando o intervalo está preenchido e inclui o dia limite", () => {
    const shoot = filterProjects(catalog, participants, {
      ...emptySearch,
      shootFrom: "2026-10-01",
      shootTo: "2026-10-01",
    }).map((item) => item.id);
    assert.deepEqual(shoot, ["p1"]);

    const open = filterProjects(catalog, [], emptySearch).map((item) => item.id);
    assert.deepEqual(open, ["p1", "p2", "p3", "foreign"]);
  });
});

describe("searchProjects", () => {
  it("recusa quem não é do workspace", async () => {
    const { workspaces, projects, participants } = harness(catalog);
    await assert.rejects(
      () =>
        searchProjects(
          "outsider",
          "ws-a",
          emptySearch,
          workspaces,
          projects,
          participants,
        ),
      ForbiddenError,
    );
  });

  it("devolve só o workspace da sessão e aplica o filtro combinado", async () => {
    const { workspaces, projects, participants, members } = harness(catalog);
    members.push(
      { videoProjectId: "p1", userId: "caio" },
      { videoProjectId: "foreign", userId: "caio" },
    );
    const rows = await searchProjects(
      "viewer",
      "ws-a",
      {
        ...emptySearch,
        text: "ação",
        status: "EDITING",
        ownerId: "ana",
        participantId: "caio",
        product: "solar",
        priority: "HIGH",
        shootFrom: "2026-10-01",
        publishTo: "2026-10-10",
      },
      workspaces,
      projects,
      participants,
    );
    assert.deepEqual(
      rows.map((item) => item.id),
      ["p1"],
    );
  });

  it("não vaza produção de outro workspace mesmo se a lista vier misturada", async () => {
    const { workspaces, projects, participants } = harness([]);
    projects.list = async () => catalog;
    const rows = await searchProjects(
      "owner",
      "ws-a",
      emptySearch,
      workspaces,
      projects,
      participants,
    );
    assert.deepEqual(
      rows.map((item) => item.workspaceId),
      ["ws-a", "ws-a", "ws-a"],
    );
  });
});
