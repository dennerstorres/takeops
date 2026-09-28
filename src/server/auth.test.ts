import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { redactForLog } from "./auth-log.ts";
import { hasSessionCookie, isPublicPath } from "./auth-routes.ts";

describe("rotas públicas", () => {
  it("libera só login e o callback do Auth.js", () => {
    assert.equal(isPublicPath("/login"), true);
    assert.equal(isPublicPath("/api/auth/callback/google"), true);
    assert.equal(isPublicPath("/"), false);
    assert.equal(isPublicPath("/api/auth-extra"), false);
  });
});

describe("cookie de sessão", () => {
  it("reconhece o cookie do Auth.js e ignora outros", () => {
    assert.equal(hasSessionCookie(["authjs.session-token"]), true);
    assert.equal(hasSessionCookie(["__Secure-authjs.session-token"]), true);
    assert.equal(hasSessionCookie(["theme", "sidebar"]), false);
  });
});

describe("redactForLog", () => {
  it("não deixa token OAuth no log", () => {
    const redacted = redactForLog({
      message: "callback?code=abc123&access_token=ya29.secret",
      access_token: "ya29.secret",
      nested: { refresh_token: "1//refresh", note: "Bearer ya29.secret" },
    }) as {
      message: string;
      access_token: string;
      nested: { refresh_token: string; note: string };
    };

    assert.equal(redacted.access_token, "[redacted]");
    assert.equal(redacted.nested.refresh_token, "[redacted]");
    assert.equal(redacted.message.includes("ya29.secret"), false);
    assert.equal(redacted.message.includes("abc123"), false);
    assert.equal(redacted.nested.note.includes("ya29.secret"), false);
  });
});
