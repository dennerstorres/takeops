import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { utcToZonedLocal, zonedLocalToUtc } from "./zoned-time.ts";

describe("horário do fuso do workspace", () => {
  it("converte o horário digitado para UTC e volta", () => {
    const utc = zonedLocalToUtc("2026-10-05T14:30", "America/Cuiaba");
    assert.equal(utc?.toISOString(), "2026-10-05T18:30:00.000Z");
    assert.equal(
      utcToZonedLocal(new Date("2026-10-05T18:30:00.000Z"), "America/Cuiaba"),
      "2026-10-05T14:30",
    );
  });

  it("respeita horário de verão do fuso", () => {
    assert.equal(
      zonedLocalToUtc("2026-07-01T09:00", "Europe/Lisbon")?.toISOString(),
      "2026-07-01T08:00:00.000Z",
    );
    assert.equal(
      zonedLocalToUtc("2026-01-01T09:00", "Europe/Lisbon")?.toISOString(),
      "2026-01-01T09:00:00.000Z",
    );
  });

  it("recusa texto fora do formato e data impossível", () => {
    assert.equal(zonedLocalToUtc("2026-02-30T10:00", "UTC"), null);
    assert.equal(zonedLocalToUtc("amanhã", "UTC"), null);
    assert.equal(zonedLocalToUtc("2026-10-05T25:00", "UTC"), null);
  });
});
