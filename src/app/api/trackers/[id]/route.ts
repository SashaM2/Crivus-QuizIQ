import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { canAccessTracker } from "@/server/trackers";
import { db } from "@/server/db";
import { trackers } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { extractOrigin, checkOriginAllowed } from "@/server/trackers";
import { z } from "zod";

const updateTrackerSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  siteUrl: z.string().url().optional(),
  origins: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canAccess = await canAccessTracker(user.userId, params.id, user.role);
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tracker = await db
    .select()
    .from(trackers)
    .where(eq(trackers.trackerId, params.id))
    .limit(1);

  if (!tracker.length) {
    return NextResponse.json({ error: "Tracker not found" }, { status: 404 });
  }

  return NextResponse.json(tracker[0]);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only owner can update (super_admin can only revoke)
  const tracker = await db
    .select()
    .from(trackers)
    .where(eq(trackers.trackerId, params.id))
    .limit(1);

  if (!tracker.length) {
    return NextResponse.json({ error: "Tracker not found" }, { status: 404 });
  }

  if (user.role !== "super_admin" && tracker[0].ownerUserId !== user.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const updates = updateTrackerSchema.parse(body);

    // Validate origins if provided
    if (updates.origins) {
      for (const origin of updates.origins) {
        const allowed = await checkOriginAllowed(origin);
        if (!allowed) {
          return NextResponse.json({ error: `Origin not allowed: ${origin}` }, { status: 403 });
        }
      }
    }

    // Extract origin from siteUrl if provided
    if (updates.siteUrl) {
      const origin = extractOrigin(updates.siteUrl);
      if (!origin) {
        return NextResponse.json({ error: "Invalid site URL" }, { status: 400 });
      }
      updates.origins = [origin];
    }

    const updated = await db
      .update(trackers)
      .set(updates)
      .where(eq(trackers.trackerId, params.id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tracker = await db
    .select()
    .from(trackers)
    .where(eq(trackers.trackerId, params.id))
    .limit(1);

  if (!tracker.length) {
    return NextResponse.json({ error: "Tracker not found" }, { status: 404 });
  }

  // Only owner or super_admin can delete
  if (user.role !== "super_admin" && tracker[0].ownerUserId !== user.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(trackers).where(eq(trackers.trackerId, params.id));

  return NextResponse.json({ success: true });
}

