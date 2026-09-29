import { ValidationError } from "./errors.ts";

// O link vira <a href> para toda a equipe: só http(s), com host, e sem
// usuário e senha embutidos, que vazariam para quem abre a produção.
export function externalUrl(value: string, field = "url") {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ValidationError({ [field]: "Informe um link http(s) válido." });
  }
  if (
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    !parsed.hostname
  ) {
    throw new ValidationError({ [field]: "Informe um link http(s) válido." });
  }
  if (parsed.username || parsed.password) {
    throw new ValidationError({
      [field]:
        "Tire usuário e senha do link; compartilhe o acesso pela ferramenta.",
    });
  }
  return parsed.toString();
}
