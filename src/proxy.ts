import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  hasSessionCookie,
  isPublicPath,
  safeNextPath,
} from "@/server/auth-routes";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name);
  if (!hasSessionCookie(cookieNames)) {
    const loginUrl = new URL("/login", request.url);
    const nextPath = safeNextPath(`${pathname}${request.nextUrl.search}`);
    if (nextPath && nextPath !== "/") {
      loginUrl.searchParams.set("callbackUrl", nextPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
