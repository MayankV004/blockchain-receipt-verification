import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED = ["/dashboard", "/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!PROTECTED.some(r => pathname.startsWith(r))) return NextResponse.next();

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
    headers: { cookie: request.headers.get("cookie") || "" },
  });

  if (!sessionRes.ok) return NextResponse.redirect(new URL("/login", request.url));

  const session = await sessionRes.json();
  if (session?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
