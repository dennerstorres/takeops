import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stripPhase } from "./strip-phase.ts";

describe("stripPhase", () => {
  it("agrupa as etapas da produção em cinco cartolinas", () => {
    assert.equal(stripPhase("IDEA"), "plan");
    assert.equal(stripPhase("PRE_PRODUCTION"), "plan");
    assert.equal(stripPhase("SCRIPTING"), "plan");
    assert.equal(stripPhase("READY_TO_RECORD"), "set");
    assert.equal(stripPhase("RECORDING"), "set");
    assert.equal(stripPhase("EDITING"), "post");
    assert.equal(stripPhase("REVIEW"), "post");
    assert.equal(stripPhase("APPROVED"), "done");
    assert.equal(stripPhase("SCHEDULED"), "done");
    assert.equal(stripPhase("PUBLISHED"), "done");
    assert.equal(stripPhase("ARCHIVED"), "shelf");
  });

  it("cai na cartolina branca quando a etapa é desconhecida", () => {
    assert.equal(stripPhase("OUTRA"), "plan");
  });
});
