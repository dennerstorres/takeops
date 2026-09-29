import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addDays,
  monthGrid,
  parseMonth,
  shiftMonth,
  weekStart,
} from "./calendar-grid.ts";

describe("grade do calendário", () => {
  it("começa no domingo e tem seis semanas", () => {
    const grid = monthGrid("2026-10");
    assert.equal(grid.length, 42);
    assert.equal(grid[0], "2026-09-27");
    assert.equal(grid[4], "2026-10-01");
    assert.equal(grid[41], "2026-11-07");
  });

  it("anda dias, semanas e meses sem fuso", () => {
    assert.equal(addDays("2026-02-28", 1), "2026-03-01");
    assert.equal(weekStart("2026-10-01"), "2026-09-27");
    assert.equal(weekStart("2026-09-27"), "2026-09-27");
    assert.equal(shiftMonth("2026-12", 1), "2027-01");
    assert.equal(shiftMonth("2026-01", -1), "2025-12");
  });

  it("aceita só mês válido na URL", () => {
    assert.equal(parseMonth("2026-10"), "2026-10");
    for (const value of ["2026-13", "2026-1", "abc", undefined, "1999-12"]) {
      assert.equal(parseMonth(value), null, String(value));
    }
  });
});
