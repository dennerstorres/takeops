import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildLoginEmail } from "./login-email.ts";

describe("e-mail do link de login", () => {
  it("leva o link no texto e no botão, com o host no assunto", () => {
    const url =
      "https://app.exemplo.dev/api/auth/callback/nodemailer?token=abc&email=a%40b.dev";
    const mail = buildLoginEmail({ url, host: "app.exemplo.dev" });
    assert.equal(mail.subject, "Seu link para entrar no app.exemplo.dev");
    assert.ok(mail.text.includes(url));
    assert.ok(mail.html.includes(url.replace(/&/g, "&amp;")));
  });

  it("escapa HTML vindo do link e do host", () => {
    const mail = buildLoginEmail({
      url: 'https://x.dev/"><script>alert(1)</script>',
      host: "<b>x</b>",
    });
    assert.ok(!mail.html.includes("<script>"));
    assert.ok(!mail.html.includes("<b>x</b>"));
    assert.ok(mail.html.includes("&lt;script&gt;"));
  });
});
