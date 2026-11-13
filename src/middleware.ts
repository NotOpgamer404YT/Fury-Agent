import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/projects", "/tasks", "/providers", "/github", "/approvals", "/settings", "/editor"];

export function middleware(req: NextRequest) {
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

export const config = { matcher: ["/dashboard/:path*", "/projects/:path*", "/tasks/:path*", "/providers/:path*", "/github/:path*", "/approvals/:path*", "/settings/:path*", "/editor/:path*"] };
