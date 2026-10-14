import { NextResponse, type NextRequest } from "next/server";
import jwt from "jsonwebtoken";

// nodejs runtime because jsonwebtoken relies on node:crypto.
// This middleware is a UX guard only — API routes enforce the real security boundary.
export const runtime = "nodejs";

export const config = {
  matcher: ["/favorites/:path*", "/profile/:path*", "/admin/:path*"],
};

export function middleware(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  let valid = false;
  if (token && process.env.JWT_SECRET) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      valid = true;
    } catch {
      valid = false;
    }
  }
  if (valid) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  const next = req.nextUrl.pathname + req.nextUrl.search;
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}
