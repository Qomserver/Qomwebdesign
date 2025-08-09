import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const publicPaths = ["/login", "/api/auth/login", "/api/auth/register", "/api/health"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    const response = NextResponse.next();
    response.headers.set("Content-Language", "fa-IR");
    response.headers.set("Direction", "rtl");
    return response;
  }

  const token = request.cookies.get("token")?.value;
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "secret");
    await jwtVerify(token, secret);
    const response = NextResponse.next();
    response.headers.set("Content-Language", "fa-IR");
    response.headers.set("Direction", "rtl");
    return response;
  } catch {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets).*)"],
};