import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasSessionCookie, isPublicPath } from "@/server/auth-routes";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name);
  if (!hasSessionCookie(cookieNames)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
