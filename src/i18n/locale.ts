export const locales = ["pt-BR", "en"] as const;
export type Locale = (typeof locales)[number];

// Sem preferência nem idioma reconhecido no navegador, o padrão é inglês
// porque o repositório é público (ADR-041).
export const defaultLocale: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return (locales as readonly unknown[]).includes(value);
}

// Ordem: preferência salva do usuário, depois Accept-Language, depois `en`.
// Só o idioma base conta no navegador: "pt-PT" também cai em pt-BR.
export function resolveLocale(
  saved: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Locale {
  if (isLocale(saved)) return saved;
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((param) => param.trim().startsWith("q="));
      const weight = q ? Number(q.trim().slice(2)) : 1;
      return { tag: tag.toLowerCase(), weight, index };
    })
    .filter(
      (entry) => entry.tag && Number.isFinite(entry.weight) && entry.weight > 0,
    )
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (base === "pt") return "pt-BR";
    if (base === "en") return "en";
  }
  return defaultLocale;
}
