// Contato das páginas públicas de privacidade e termos (LEGAL-001). Opcional:
// sem ele, as páginas mandam falar com quem administra a instância.

type Env = Record<string, string | undefined>;

export function legalContact(env: Env) {
  const value = env.LEGAL_CONTACT_EMAIL?.trim();
  return value ? value : null;
}
