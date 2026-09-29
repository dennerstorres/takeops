import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildRecordView, clampPosition } from "./record-view.ts";

function scene(order: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `s${order}`,
    order,
    title: `Cena ${order}`,
    type: "OTHER" as const,
    status: "PLANNED" as const,
    speakerId: null,
    dialogue: null,
    action: null,
    cameraInstructions: null,
    editingInstructions: null,
    continuityNotes: null,
    ...overrides,
  } as Parameters<typeof buildRecordView>[0][number];
}

function shot(id: string, order: number) {
  return {
    id,
    order,
    name: null,
    shotType: "CAMERA" as const,
    framing: null,
    cameraLabel: null,
    angle: null,
    subject: null,
    movement: null,
    description: null,
    requiredTakes: 1,
    notes: null,
  };
}

describe("modo gravação", () => {
  it("conta só as cenas que vão para a câmera, na ordem", () => {
    const view = buildRecordView(
      [
        scene(3),
        scene(1, { speakerId: "u1" }),
        scene(2, { status: "DISCARDED" }),
      ],
      new Map([["s1", [shot("b", 2), shot("a", 1)]]]),
      [{ id: "u1", label: "Pedro" }],
      1,
    );

    assert.ok(view);
    assert.equal(view.total, 2);
    assert.equal(view.scene.id, "s1");
    assert.equal(view.scene.speaker, "Pedro");
    assert.deepEqual(
      view.shots.map((row) => row.id),
      ["a", "b"],
    );
    assert.equal(view.previous, null);
    assert.equal(view.next, 2);
  });

  it("na última cena não há próxima", () => {
    const view = buildRecordView([scene(1), scene(2)], new Map(), [], 2);

    assert.ok(view);
    assert.equal(view.scene.id, "s2");
    assert.equal(view.previous, 1);
    assert.equal(view.next, null);
    assert.deepEqual(view.shots, []);
  });

  it("progresso conta gravadas e refazer entre as cenas da gravação", () => {
    const view = buildRecordView(
      [
        scene(1, { status: "RECORDED" }),
        scene(2, { status: "NEEDS_RETAKE" }),
        scene(3, { status: "RECORDED" }),
        scene(4),
        scene(5, { status: "DISCARDED" }),
      ],
      new Map(),
      [],
      1,
    );

    assert.ok(view);
    assert.equal(view.done, 2);
    assert.equal(view.retakes, 1);
    assert.equal(view.total, 4);
  });

  it("sem cena gravável não monta a tela", () => {
    assert.equal(
      buildRecordView([scene(1, { status: "DISCARDED" })], new Map(), [], 1),
      null,
    );
  });

  it("posição inválida cai na primeira e excesso para na última", () => {
    assert.equal(clampPosition(undefined, 5), 1);
    assert.equal(clampPosition("abc", 5), 1);
    assert.equal(clampPosition("0", 5), 1);
    assert.equal(clampPosition("2.5", 5), 1);
    assert.equal(clampPosition("3", 5), 3);
    assert.equal(clampPosition("9", 5), 5);
    assert.equal(clampPosition(["2", "3"], 5), 1);
  });
});
