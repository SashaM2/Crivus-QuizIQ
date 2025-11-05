import { db } from "./db";
import { trackers, trackerMembers, users } from "./db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getPolicies } from "./policies";
import crypto from "crypto";

export async function canAccessTracker(userId: string, trackerId: string, role: "super_admin" | "friend"): Promise<boolean> {
  if (role === "super_admin") {
    return true;
  }

  // Check if user owns the tracker
  const tracker = await db
    .select()
    .from(trackers)
    .where(and(eq(trackers.trackerId, trackerId), eq(trackers.ownerUserId, userId)))
    .limit(1);

  if (tracker.length > 0) {
    return true;
  }

  // Check if user is a member
  const member = await db
    .select()
    .from(trackerMembers)
    .where(and(eq(trackerMembers.trackerId, trackerId), eq(trackerMembers.userId, userId)))
    .limit(1);

  return member.length > 0;
}

export async function getUserTrackers(userId: string, role: "super_admin" | "friend") {
  if (role === "super_admin") {
    return db.select().from(trackers);
  }

  // Get owned trackers
  const owned = await db
    .select()
    .from(trackers)
    .where(eq(trackers.ownerUserId, userId));

  // Get member trackers
  const memberTrackers = await db
    .select({ trackerId: trackerMembers.trackerId })
    .from(trackerMembers)
    .where(eq(trackerMembers.userId, userId));

  if (memberTrackers.length === 0) {
    return owned;
  }

  const memberTrackerIds = memberTrackers.map((m) => m.trackerId);
  const memberTrackersData = await db
    .select()
    .from(trackers)
    .where(inArray(trackers.trackerId, memberTrackerIds));

  return [...owned, ...memberTrackersData];
}

export async function checkTrackerQuota(userId: string): Promise<{ allowed: boolean; current: number; max: number }> {
  const policy = await getPolicies();
  const userTrackers = await db
    .select()
    .from(trackers)
    .where(eq(trackers.ownerUserId, userId));

  const current = userTrackers.length;
  const max = policy.maxTrackersPerUser;

  return {
    allowed: current < max,
    current,
    max,
  };
}

export function generateTrackerId(): string {
  return `trk_${crypto.randomBytes(8).toString("hex")}`;
}

export function extractOrigin(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "";
  }
}

