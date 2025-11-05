import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { invites, users } from "@/server/db/schema";
import { hashPassword, createToken, setAuthCookie } from "@/server/auth";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";

const acceptInviteSchema = z.object({
  code: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, email, password } = acceptInviteSchema.parse(body);

    const invite = await db
      .select()
      .from(invites)
      .where(
        and(
          eq(invites.code, code),
          eq(invites.email, email),
          isNull(invites.consumedAt)
        )
      )
      .limit(1);

    if (!invite.length) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
    }

    if (invite[0].expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite code expired" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const passHash = await hashPassword(password);

    const newUser = await db
      .insert(users)
      .values({
        email,
        passHash,
        role: invite[0].role,
      })
      .returning();

    await db
      .update(invites)
      .set({ consumedAt: new Date() })
      .where(eq(invites.id, invite[0].id));

    const token = await createToken({
      userId: newUser[0].id,
      email: newUser[0].email,
      role: newUser[0].role as "super_admin" | "friend",
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        role: newUser[0].role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

