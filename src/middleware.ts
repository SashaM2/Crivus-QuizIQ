import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Durante o build, permitir placeholder
    const isBuildTime = process.env.NEXT_PHASE?.includes("build");
    if (isBuildTime) {
      return new TextEncoder().encode("placeholder-for-build");
    }
    // Em runtime de produção, exigir
    if (process.env.NODE_ENV === "production" && !isBuildTime) {
      throw new Error("JWT_SECRET is required in production");
    }
    console.warn("⚠️  JWT_SECRET not set, using default (UNSAFE FOR PRODUCTION)");
    return new TextEncoder().encode("default-secret-change-me");
  }
  if (secret === "default-secret-change-me" || secret === "placeholder-for-build") {
    // Durante o build, permitir
    const isBuildTime = process.env.NEXT_PHASE?.includes("build");
    if (isBuildTime) {
      return new TextEncoder().encode(secret);
    }
    // Em runtime de produção, não permitir valores placeholder
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET cannot be placeholder in production");
    }
    console.warn("⚠️  Using default JWT_SECRET (UNSAFE FOR PRODUCTION)");
  }
  return new TextEncoder().encode(secret);
}

const JWT_SECRET = getJwtSecret();

interface JWTPayload {
  userId: string;
  email: string;
  role: "super_admin" | "friend";
  csrf: string;
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Ensure payload includes all expected properties with correct types
    if (
      typeof payload.userId === "string" &&
      typeof payload.email === "string" &&
      (payload.role === "super_admin" || payload.role === "friend") &&
      typeof payload.csrf === "string"
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        csrf: payload.csrf,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Public routes
  if (
    pathname.startsWith("/api/collect") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/health")
  ) {
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

