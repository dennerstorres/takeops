import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProjectBoard, boardColumns } from "./project-board.ts";
import type { ProjectRecord } from "./project-repository.ts";
import { testTranslator } from "../i18n/test-translator.ts";

const t = testTranslator();

function project(
  overrides: Partial<ProjectRecord> & Pick<ProjectRecord, "id" | "status">,
): ProjectRecord {
  return {
    workspaceId: "ws-a",
    title: overrides.id,
    slug: null,
    description: null,
    objective: null,
    audience: null,
    product: null,
    format: "DEMO",
    aspectRatio: "NINE_SIXTEEN",
    estimatedDurationSeconds: null,
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

describe("quadro de produções", () => {
  it("abre as colunas da spec e guarda o arquivado no fim", () => {
    const board = buildProjectBoard([], [], [], t);
    assert.deepEqual(
      board.map((column) => column.title),
      [
        "Ideias",
        "Pré-produção",
        "Roteiro",
        "Pronto para gravar",
        "Gravação",
        "Edição",
        "Revisão",
        "Aprovado",
        "Agendado",
        "Publicado",
        "Arquivado",
      ],
    );
    assert.equal(board.length, boardColumns.length);
    assert.deepEqual(
      board.map((column) => column.cards.length),
      board.map(() => 0),
    );
  });

  it("coloca o card na etapa e mostra responsável, participante, data e prioridade", () => {
    const board = buildProjectBoard(
      [
        project({
          id: "edit",
          status: "EDITING",
          title: "Corte",
          ownerId: "ana",
          priority: "HIGH",
          thumbnailUrl: "https://cdn.example/corte.jpg",
          plannedShootDate: new Date("2026-10-02T00:00:00.000Z"),
        }),
        project({
          id: "idea",
          status: "IDEA",
          title: "Rascunho",
          ownerId: "ana",
        }),
        project({
          id: "file",
          status: "ARCHIVED",
          title: "Antigo",
        }),
      ],
      [
        {
          videoProjectId: "edit",
          userId: "ana",
          name: "Ana",
          email: null,
        },
        {
          videoProjectId: "edit",
          userId: "caio",
          name: null,
          email: "caio@example.com",
        },
        {
          videoProjectId: "other-workspace",
          userId: "fora",
          name: "Fora",
          email: null,
        },
      ],
      [{ userId: "ana", name: "Ana Lima", email: null }],
      t,
    );
    const editing = board.find((column) => column.status === "EDITING");
    assert.deepEqual(editing?.cards, [
      {
        id: "edit",
        title: "Corte",
        thumbnailUrl: "https://cdn.example/corte.jpg",
        people: ["Ana Lima", "caio@example.com"],
        shootDate: "02/10/2026",
        priority: "Alta",
        alerts: [],
      },
    ]);
    assert.deepEqual(
      board
        .find((column) => column.status === "IDEA")
        ?.cards.map((card) => card.id),
      ["idea"],
    );
    assert.deepEqual(
      board
        .find((column) => column.status === "ARCHIVED")
        ?.cards.map((card) => card.title),
      ["Antigo"],
    );
    assert.equal(
      board
        .filter(
          (column) =>
            column.status !== "EDITING" &&
            column.status !== "IDEA" &&
            column.status !== "ARCHIVED",
        )
        .every((column) => column.cards.length === 0),
      true,
    );
  });

  it("avisa pronto para gravar sem cena pronta e some quando a cena existe", () => {
    const missing = buildProjectBoard(
      [project({ id: "gravar", status: "READY_TO_RECORD", title: "Sem cena" })],
      [],
      [],
      t,
    );
    const ready = buildProjectBoard(
      [project({ id: "gravar", status: "READY_TO_RECORD", title: "Com cena" })],
      [],
      [],
      t,
      { gravar: 1 },
    );
    const idea = buildProjectBoard(
      [project({ id: "ideia", status: "IDEA", title: "Ideia" })],
      [],
      [],
      t,
    );
    assert.deepEqual(
      missing.find((column) => column.status === "READY_TO_RECORD")?.cards[0]
        ?.alerts,
      ["Não há cenas prontas."],
    );
    assert.deepEqual(
      ready.find((column) => column.status === "READY_TO_RECORD")?.cards[0]
        ?.alerts,
      [],
    );
    assert.deepEqual(
      idea.find((column) => column.status === "IDEA")?.cards[0]?.alerts,
      [],
    );
  });
});
