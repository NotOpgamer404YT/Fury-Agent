import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 request proxy (formerly `middleware`).
 * Redirects unauthenticated page requests before they reach a protected route.
 * API handlers still verify the session themselves — this is a UX shortcut, not
 * the security boundary.
 */
const PROTECTED = ["/dashboard", "/projects", "/tasks", "/providers", "/github", "/approvals", "/settings", "/editor"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const hasSession = Boolean(req.cookies.get("fury_session")?.value);
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/projects/:path*", "/tasks/:path*", "/providers/:path*",
    "/github/:path*", "/approvals/:path*", "/settings/:path*", "/editor/:path*",
  ],
};
