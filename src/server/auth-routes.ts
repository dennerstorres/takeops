const sessionCookies = new Set([
  "authjs.session-token",
  "__Secure-authjs.session-token",
]);

export function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/api/auth" ||
    pathname.startsWith("/api/auth/")
  );
}

export function hasSessionCookie(cookieNames: string[]) {
  return cookieNames.some((name) => sessionCookies.has(name));
}
