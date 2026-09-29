import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatTimestamp, parseTimestamp } from "./timestamp.ts";

describe("tempo da revisão", () => {
  it("lê MM:SS, H:MM:SS e segundos soltos", () => {
    assert.equal(parseTimestamp("00:18"), 18);
    assert.equal(parseTimestamp(" 1:04 "), 64);
    assert.equal(parseTimestamp("75:00"), 4500);
    assert.equal(parseTimestamp("1:02:03"), 3723);
    assert.equal(parseTimestamp("18"), 18);
    assert.equal(parseTimestamp(""), null);
  });

  it("recusa o que não é tempo", () => {
    for (const value of [
      "0:60",
      "1:5",
      "1:61:00",
      "1:2:03",
      "a:10",
      "1:02:03:04",
      "-5",
      "1.5",
      ":30",
    ]) {
      assert.ok(Number.isNaN(parseTimestamp(value)), value);
    }
  });

  it("mostra MM:SS até uma hora e H:MM:SS depois", () => {
    assert.equal(formatTimestamp(18), "00:18");
    assert.equal(formatTimestamp(64), "01:04");
    assert.equal(formatTimestamp(3599), "59:59");
    assert.equal(formatTimestamp(3723), "1:02:03");
  });

  it("ida e volta mantém o valor", () => {
    for (const seconds of [0, 18, 64, 3600, 86399]) {
      assert.equal(parseTimestamp(formatTimestamp(seconds)), seconds);
    }
  });
});
