import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { getUserTrackers } from "@/server/trackers";
import { db } from "@/server/db";
import { trackers } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { checkTrackerQuota, generateTrackerId, extractOrigin } from "@/server/trackers";
import { checkOriginAllowed } from "@/server/policies";
import { z } from "zod";

const createTrackerSchema = z.object({
  name: z.string().min(1).max(255),
  siteUrl: z.string().url(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userTrackers = await getUserTrackers(user.userId, user.role);
  return NextResponse.json(userTrackers);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, siteUrl } = createTrackerSchema.parse(body);

    // Check quota
    const quota = await checkTrackerQuota(user.userId);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Tracker quota exceeded. Max: ${quota.max}` },
        { status: 403 }
      );
    }

    // Extract origin
    const origin = extractOrigin(siteUrl);
    if (!origin) {
      return NextResponse.json({ error: "Invalid site URL" }, { status: 400 });
    }

    // Check origin is allowed by policies
    const originAllowed = await checkOriginAllowed(origin);
    if (!originAllowed) {
      return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
    }

    const trackerId = generateTrackerId();

    const newTracker = await db
      .insert(trackers)
      .values({
        trackerId,
        ownerUserId: user.userId,
        name,
        siteUrl,
        origins: [origin],
        active: true,
      })
      .returning();

    return NextResponse.json(newTracker[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

