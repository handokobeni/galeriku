import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/features/auth/lib/auth";

const publicPaths = ["/login", "/register", "/setup", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check session via Better Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // No session → redirect to login
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes → owner only
  if (pathname.startsWith("/admin") && (session.user as Record<string, unknown>).role !== "owner") {
    return NextResponse.redirect(new URL("/albums", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)",
  ],
};
