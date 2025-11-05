import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userData = await db.select().from(users).where(eq(users.id, user.userId)).limit(1);

  if (!userData.length) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: userData[0].id,
    email: userData[0].email,
    role: userData[0].role,
    createdAt: userData[0].createdAt,
    lastLoginAt: userData[0].lastLoginAt,
  });
}

