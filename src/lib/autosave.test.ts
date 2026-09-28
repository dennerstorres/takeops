import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createAutosave, type AutosaveResult } from "./autosave.ts";

function fakeTimers() {
  let next: (() => void) | null = null;
  return {
    timers: {
      set: (fn: () => void) => {
        next = fn;
        return fn;
      },
      clear: () => {
        next = null;
      },
    },
    fire() {
      const fn = next;
      next = null;
      fn?.();
    },
    get armed() {
      return next !== null;
    },
  };
}

const tick = () => new Promise((done) => setImmediate(done));

function deferred() {
  let resolve!: (result: AutosaveResult) => void;
  const promise = new Promise<AutosaveResult>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("autosave", () => {
  it("espera a pausa e grava só a última edição", async () => {
    const clock = fakeTimers();
    const saved: string[] = [];
    const states: string[] = [];
    const autosave = createAutosave<string>({
      save: async (value) => {
        saved.push(value);
        return { ok: true };
      },
      onChange: (status) => states.push(status),
      timers: clock.timers,
    });

    autosave.schedule("a");
    autosave.schedule("ab");
    assert.deepEqual(saved, []);
    clock.fire();
    await autosave.flush();

    assert.deepEqual(saved, ["ab"]);
    assert.deepEqual(states, ["saving", "saved"]);
    assert.equal(autosave.hasUnsaved(), false);
  });

  it("não dispara duas gravações ao mesmo tempo", async () => {
    const clock = fakeTimers();
    const calls: { value: string; wait: ReturnType<typeof deferred> }[] = [];
    let running = 0;
    let maxRunning = 0;
    const autosave = createAutosave<string>({
      save: (value) => {
        running += 1;
        maxRunning = Math.max(maxRunning, running);
        const wait = deferred();
        calls.push({ value, wait });
        return wait.promise.finally(() => {
          running -= 1;
        });
      },
      onChange: () => {},
      timers: clock.timers,
    });

    autosave.schedule("a");
    const first = autosave.flush();
    autosave.schedule("ab");
    clock.fire();
    await tick();
    assert.equal(calls.length, 1);

    calls[0].wait.resolve({ ok: true });
    await tick();
    assert.equal(calls.length, 2);
    assert.equal(calls[1].value, "ab");
    calls[1].wait.resolve({ ok: true });
    await first;

    assert.equal(maxRunning, 1);
    assert.equal(autosave.hasUnsaved(), false);
  });

  it("mostra erro e mantém a edição como não salva", async () => {
    const clock = fakeTimers();
    const states: [string, string | undefined][] = [];
    const autosave = createAutosave<string>({
      save: async () => ({ ok: false, message: "Informe o título." }),
      onChange: (status, message) => states.push([status, message]),
      timers: clock.timers,
    });

    autosave.schedule("");
    await autosave.flush();

    assert.deepEqual(states.at(-1), ["error", "Informe o título."]);
    assert.equal(autosave.hasUnsaved(), true);
  });

  it("falha de rede vira erro sem texto técnico", async () => {
    const clock = fakeTimers();
    const states: [string, string | undefined][] = [];
    const autosave = createAutosave<string>({
      save: async () => {
        throw new Error("fetch failed");
      },
      onChange: (status, message) => states.push([status, message]),
      timers: clock.timers,
    });

    autosave.schedule("a");
    await autosave.flush();

    assert.deepEqual(states.at(-1), [
      "error",
      "Verifique a conexão e tente novamente.",
    ]);
  });

  it("cancelar descarta a espera", async () => {
    const clock = fakeTimers();
    const saved: string[] = [];
    const autosave = createAutosave<string>({
      save: async (value) => {
        saved.push(value);
        return { ok: true };
      },
      onChange: () => {},
      timers: clock.timers,
    });

    autosave.schedule("a");
    autosave.cancel();
    assert.equal(clock.armed, false);
    await autosave.flush();

    assert.deepEqual(saved, []);
  });
});
