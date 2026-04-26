import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Adrien2026";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === "/admin/login" || path.startsWith("/api/admin/auth")) {
    return NextResponse.next();
  }

  const session = request.cookies.get("ah_admin_session")?.value;
  const isAuthed = session === ADMIN_PASSWORD;

  if (!isAuthed) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    if (path !== "/admin") loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/crm/:path*",
    "/api/meetings/:path*",
  ],
};
