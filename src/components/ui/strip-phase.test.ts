import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ideaPhase, scenePhase, sceneTip, stripPhase } from "./strip-phase.ts";

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

describe("scenePhase e sceneTip", () => {
  it("põe a cena no set quando está pronta ou precisa refazer", () => {
    assert.equal(scenePhase("PLANNED"), "plan");
    assert.equal(scenePhase("READY"), "set");
    assert.equal(scenePhase("NEEDS_RETAKE"), "set");
    assert.equal(scenePhase("RECORDED"), "done");
    assert.equal(scenePhase("DISCARDED"), "shelf");
  });

  it("marca refazer como pendência e descartada como parada", () => {
    assert.equal(sceneTip("NEEDS_RETAKE"), "pending");
    assert.equal(sceneTip("DISCARDED"), "idle");
    assert.equal(sceneTip("RECORDED"), "ok");
  });
});

describe("ideaPhase", () => {
  it("leva a ideia da cartolina branca até o arquivo", () => {
    assert.equal(ideaPhase("NEW"), "plan");
    assert.equal(ideaPhase("UNDER_REVIEW"), "post");
    assert.equal(ideaPhase("CONVERTED"), "done");
    assert.equal(ideaPhase("DISCARDED"), "shelf");
  });
});
