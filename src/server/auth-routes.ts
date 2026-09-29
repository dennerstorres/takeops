const sessionCookies = new Set([
  "authjs.session-token",
  "__Secure-authjs.session-token",
]);

export function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/login/verificar" ||
    // Healthcheck do contêiner (Docker/Coolify), sem sessão.
    pathname === "/api/health" ||
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
