import { createTranslator } from "next-intl";
import en from "../../messages/en.json" with { type: "json" };
import ptBR from "../../messages/pt-BR.json" with { type: "json" };
import type { Translate } from "./translate.ts";

// Tradutor real, com o catálogo de verdade, para testes fora do Next.
export function testTranslator(locale: "pt-BR" | "en" = "pt-BR"): Translate {
  return createTranslator({
    locale,
    messages: locale === "en" ? en : ptBR,
  }) as unknown as Translate;
}
