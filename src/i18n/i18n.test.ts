import assert from "node:assert/strict";
import { describe, it } from "node:test";
import en from "../../messages/en.json" with { type: "json" };
import ptBR from "../../messages/pt-BR.json" with { type: "json" };
import { ForbiddenError, NotFoundError } from "../server/errors.ts";
import { toFailure } from "../server/service.ts";
import { resolveLocale } from "./locale.ts";
import { testTranslator } from "./test-translator.ts";

function keys(tree: object, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? keys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe("catálogos", () => {
  it("têm as mesmas chaves nos dois idiomas", () => {
    const pt = new Set(keys(ptBR));
    const english = new Set(keys(en));
    assert.deepEqual(
      [...pt].filter((key) => !english.has(key)),
      [],
      "chave em pt-BR faltando em en",
    );
    assert.deepEqual(
      [...english].filter((key) => !pt.has(key)),
      [],
      "chave em en faltando em pt-BR",
    );
  });
});

describe("resolveLocale", () => {
  it("prefere o idioma salvo do usuário", () => {
    assert.equal(resolveLocale("pt-BR", "en-US,en;q=0.9"), "pt-BR");
    assert.equal(resolveLocale("en", "pt-BR"), "en");
  });

  it("sem preferência, segue o Accept-Language pelo peso", () => {
    assert.equal(resolveLocale(null, "pt-PT,pt;q=0.9"), "pt-BR");
    assert.equal(resolveLocale(null, "fr-FR,en;q=0.5,pt;q=0.8"), "pt-BR");
    assert.equal(resolveLocale("xx", "de,en-GB;q=0.7"), "en");
  });

  it("sem nada reconhecido, cai em inglês", () => {
    assert.equal(resolveLocale(null, null), "en");
    assert.equal(resolveLocale(undefined, "de-DE,fr;q=0.8"), "en");
    assert.equal(resolveLocale(null, "pt;q=0"), "en");
  });
});

describe("erro de serviço traduzido", () => {
  it("usa a chave no idioma de quem pediu", () => {
    const t = testTranslator("en");
    assert.deepEqual(toFailure(new NotFoundError(), t), {
      ok: false,
      message: "Not found.",
    });
    assert.deepEqual(toFailure(new Error("boom"), t), {
      ok: false,
      message: "Could not complete. Please try again.",
    });
  });

  it("mensagem específica ainda sem chave segue como veio", () => {
    const t = testTranslator("en");
    assert.deepEqual(toFailure(new ForbiddenError("Só o dono."), t), {
      ok: false,
      message: "Só o dono.",
    });
  });
});
