import argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";
import { users, authAttempts } from "./db/schema";
import { eq, and, gte } from "drizzle-orm";
import crypto from "crypto";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-change-me");
const INVITE_SECRET = process.env.INVITE_SECRET || "default-invite-secret-change-me";
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_WINDOW = 15 * 60 * 1000; // 15 minutes
const JWT_EXPIRES_IN = "2h";

export interface JWTPayload {
  userId: string;
  email: string;
  role: "super_admin" | "friend";
  csrf: string;
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export async function createToken(payload: Omit<JWTPayload, "csrf">): Promise<string> {
  const csrf = crypto.randomBytes(32).toString("hex");
  const token = await new SignJWT({ ...payload, csrf })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 2, // 2 hours
    path: "/",
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}

export async function checkLockout(email: string, ip: string): Promise<{ locked: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW);

  const recentAttempts = await db
    .select()
    .from(authAttempts)
    .where(
      and(
        eq(authAttempts.email, email),
        gte(authAttempts.createdAt, windowStart),
        eq(authAttempts.success, false)
      )
    );

  if (recentAttempts.length >= LOCKOUT_ATTEMPTS) {
    const oldest = recentAttempts[0].createdAt.getTime();
    const remaining = Math.ceil((LOCKOUT_WINDOW - (Date.now() - oldest)) / 1000);
    return { locked: true, remaining };
  }

  return { locked: false, remaining: 0 };
}

export async function recordAuthAttempt(
  email: string,
  ip: string,
  success: boolean
): Promise<void> {
  await db.insert(authAttempts).values({
    email,
    ip: ip as any,
    success,
  });
}

export async function login(email: string, password: string, ip: string): Promise<{ success: boolean; user?: JWTPayload; error?: string }> {
  const lockout = await checkLockout(email, ip);
  if (lockout.locked) {
    await recordAuthAttempt(email, ip, false);
    return {
      success: false,
      error: `Account locked. Try again in ${Math.ceil(lockout.remaining / 60)} minutes.`,
    };
  }

  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user.length) {
    await recordAuthAttempt(email, ip, false);
    return { success: false, error: "Invalid email or password" };
  }

  const isValid = await verifyPassword(user[0].passHash, password);
  if (!isValid) {
    await recordAuthAttempt(email, ip, false);
    return { success: false, error: "Invalid email or password" };
  }

  await recordAuthAttempt(email, ip, true);
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user[0].id));

  const payload: Omit<JWTPayload, "csrf"> = {
    userId: user[0].id,
    email: user[0].email,
    role: user[0].role as "super_admin" | "friend",
  };

  const token = await createToken(payload);
  await setAuthCookie(token);

  return { success: true, user: { ...payload, csrf: "" } };
}

export function generateInviteCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function verifyInviteCode(code: string): boolean {
  // For now, simple verification. Can be enhanced with HMAC
  return code.length === 64;
}

