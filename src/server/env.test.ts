import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertServerEnv, checkServerEnv } from "./env.ts";

const production = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://u:p@db:5432/takeops",
  AUTH_SECRET: "x".repeat(32),
  AUTH_GOOGLE_ID: "id",
  AUTH_GOOGLE_SECRET: "segredo-do-google",
};

describe("variáveis de ambiente", () => {
  it("aceita produção completa", () => {
    assert.deepEqual(checkServerEnv(production), { ok: true });
  });

  it("em produção exige segredo forte e login Google", () => {
    const check = checkServerEnv({
      ...production,
      AUTH_SECRET: "gere com openssl rand -base64 32",
      AUTH_GOOGLE_ID: "",
      AUTH_GOOGLE_SECRET: undefined,
    });
    assert.equal(check.ok, false);
    if (check.ok) return;
    assert.equal(check.problems.length, 3);
    assert.match(check.problems.join(" "), /AUTH_SECRET/);
    assert.match(check.problems.join(" "), /AUTH_GOOGLE_ID/);
    assert.match(check.problems.join(" "), /AUTH_GOOGLE_SECRET/);
  });

  it("recusa banco que não é Postgres", () => {
    const check = checkServerEnv({ ...production, DATABASE_URL: "mysql://x" });
    assert.equal(check.ok, false);
  });

  it("em desenvolvimento só o banco é obrigatório", () => {
    assert.deepEqual(
      checkServerEnv({
        NODE_ENV: "development",
        DATABASE_URL: "postgres://localhost/x",
        AUTH_GOOGLE_ID: "",
      }),
      { ok: true },
    );
    assert.equal(checkServerEnv({ NODE_ENV: "development" }).ok, false);
  });

  it("a mensagem de erro não mostra valores", () => {
    const secret = "segredo-que-nao-pode-vazar";
    assert.throws(
      () =>
        assertServerEnv({
          ...production,
          AUTH_SECRET: secret,
          DATABASE_URL: `mysql://${secret}`,
        }),
      (error: unknown) =>
        error instanceof Error &&
        !error.message.includes(secret) &&
        error.message.includes("DATABASE_URL"),
    );
  });
});
