import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertServerEnv, checkServerEnv, loginMethods } from "./env.ts";

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

  it("em produção exige segredo forte e ao menos um login", () => {
    const check = checkServerEnv({
      ...production,
      AUTH_SECRET: "gere com openssl rand -base64 32",
      AUTH_GOOGLE_ID: "",
      AUTH_GOOGLE_SECRET: undefined,
    });
    assert.equal(check.ok, false);
    if (check.ok) return;
    assert.equal(check.problems.length, 2);
    assert.match(check.problems.join(" "), /AUTH_SECRET/);
    assert.match(check.problems.join(" "), /ao menos um login/);
  });

  it("aceita produção só com login por e-mail", () => {
    const { AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, ...base } = production;
    void AUTH_GOOGLE_ID;
    void AUTH_GOOGLE_SECRET;
    const env = {
      ...base,
      EMAIL_SERVER: "smtps://u:p@mail.exemplo.dev:465",
      EMAIL_FROM: "TakeOps <takeops@exemplo.dev>",
    };
    assert.deepEqual(checkServerEnv(env), { ok: true });
    assert.deepEqual(loginMethods(env), { google: false, email: true });
  });

  it("recusa par de login incompleto e SMTP inválido", () => {
    const check = checkServerEnv({
      ...production,
      AUTH_GOOGLE_SECRET: "",
      EMAIL_SERVER: "http://mail",
      EMAIL_FROM: "sem-arroba",
    });
    assert.equal(check.ok, false);
    if (check.ok) return;
    const text = check.problems.join(" ");
    assert.match(text, /AUTH_GOOGLE_ID e AUTH_GOOGLE_SECRET/);
    assert.match(text, /EMAIL_SERVER precisa/);
    assert.match(text, /EMAIL_FROM precisa/);
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
