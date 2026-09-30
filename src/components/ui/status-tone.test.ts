import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { statusTone } from "./status-tone.ts";

describe("statusTone", () => {
  it("segue o mapa de status do design", () => {
    assert.equal(statusTone("IDEA"), "muted");
    assert.equal(statusTone("PLANNED"), "muted");
    assert.equal(statusTone("ARCHIVED"), "muted");
    assert.equal(statusTone("CANCELED"), "muted");
    assert.equal(statusTone("SCRIPTING"), "info");
    assert.equal(statusTone("READY"), "info");
    assert.equal(statusTone("SCHEDULED"), "info");
    assert.equal(statusTone("REVIEW"), "info");
    assert.equal(statusTone("RECORDING"), "primary");
    assert.equal(statusTone("EDITING"), "primary");
    assert.equal(statusTone("IN_PROGRESS"), "primary");
    assert.equal(statusTone("NEEDS_RETAKE"), "warning");
    assert.equal(statusTone("PENDING"), "warning");
    assert.equal(statusTone("EXPIRED"), "warning");
    assert.equal(statusTone("CHANGES_REQUESTED"), "warning");
    assert.equal(statusTone("APPROVED"), "success");
    assert.equal(statusTone("RECORDED"), "success");
    assert.equal(statusTone("PUBLISHED"), "success");
    assert.equal(statusTone("OK"), "success");
    assert.equal(statusTone("DISCARDED"), "destructive");
    assert.equal(statusTone("FAILED"), "destructive");
  });

  it("cai em neutro quando o status é desconhecido", () => {
    assert.equal(statusTone("WHATEVER"), "muted");
  });
});
