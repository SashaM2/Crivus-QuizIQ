import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-change-me");

interface JWTPayload {
  userId: string;
  email: string;
  role: "super_admin" | "friend";
  csrf: string;
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname.startsWith("/api/collect") || pathname.startsWith("/api/auth/login")) {
    return NextResponse.next();
  }

  // Admin routes require super_admin
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  // Dashboard and protected routes require auth
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/my") ||
    pathname.startsWith("/api/stats") ||
    pathname.startsWith("/api/trackers") ||
    pathname.startsWith("/api/export") ||
    pathname.startsWith("/api/leads") ||
    (pathname.startsWith("/api/auth") && !pathname.startsWith("/api/auth/login"))
  ) {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/my/:path*",
    "/api/stats/:path*",
    "/api/trackers/:path*",
    "/api/export/:path*",
    "/api/leads/:path*",
    "/api/auth/:path*",
  ],
};

