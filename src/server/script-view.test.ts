import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildScriptView, formatSeconds } from "./script-view.ts";

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
    estimatedDurationSeconds: null,
    ...overrides,
  };
}

describe("leitura do roteiro", () => {
  it("segue a ordem, mostra quem fala e soma a duração estimada", () => {
    const view = buildScriptView(
      [
        scene(2, { estimatedDurationSeconds: 45, speakerId: "u2" }),
        scene(1, {
          estimatedDurationSeconds: 30,
          speakerId: "u1",
          dialogue: "Olá",
        }),
        scene(3),
      ],
      [{ id: "u1", label: "Ana" }],
    );

    assert.deepEqual(
      view.rows.map((row) => row.order),
      [1, 2, 3],
    );
    assert.equal(view.rows[0].speaker, "Ana");
    assert.equal(view.rows[0].dialogue, "Olá");
    // Quem saiu da equipe não aparece com id no lugar do nome.
    assert.equal(view.rows[1].speaker, null);
    assert.equal(view.rows[2].duration, null);
    assert.equal(view.total, "1 min 15 s");
    assert.equal(view.withoutDuration, 1);
  });

  it("formata segundos curtos e longos", () => {
    assert.equal(formatSeconds(0), "0 s");
    assert.equal(formatSeconds(59), "59 s");
    assert.equal(formatSeconds(125), "2 min 05 s");
  });
});
