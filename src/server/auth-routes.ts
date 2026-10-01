const sessionCookies = new Set([
  "authjs.session-token",
  "__Secure-authjs.session-token",
]);

export function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/login/verificar" ||
    // Privacidade e termos: o Google exige acesso sem login (LEGAL-001).
    pathname === "/privacidade" ||
    pathname === "/termos" ||
    // Healthcheck do contêiner (Docker/Coolify), sem sessão.
    pathname === "/api/health" ||
    // Cron sem sessão; a própria rota exige CRON_SECRET (HARDEN-009).
    pathname === "/api/cron/upcoming-shoots" ||
    pathname === "/api/auth" ||
    pathname.startsWith("/api/auth/")
  );
}

export function hasSessionCookie(cookieNames: string[]) {
  return cookieNames.some((name) => sessionCookies.has(name));
}

export function safeNextPath(value: unknown) {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("\\") || value.includes("://")) return null;
  if (/[\u0000-\u001F\u007F]/.test(value)) return null;
  const lowered = value.toLowerCase();
  if (
    lowered.includes("%2f") ||
    lowered.includes("%5c") ||
    lowered.includes("%00")
  ) {
    return null;
  }
  return value;
}
