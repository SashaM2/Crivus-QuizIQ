import { db } from "./db";
import { policies } from "./db/schema";
import { eq } from "drizzle-orm";

export async function getPolicies() {
  const result = await db.select().from(policies).limit(1);
  if (result.length === 0) {
    // Initialize default policies
    const defaultPolicies = {
      id: true,
      maxTrackersPerUser: 10,
      maxCollectRpsPerOrigin: 10,
      retentionDays: 365,
      allowedOrigins: [] as string[],
    };
    await db.insert(policies).values(defaultPolicies);
    return defaultPolicies;
  }
  return result[0];
}

export async function updatePolicies(updates: {
  maxTrackersPerUser?: number;
  maxCollectRpsPerOrigin?: number;
  retentionDays?: number;
  allowedOrigins?: string[];
}) {
  await db
    .update(policies)
    .set(updates)
    .where(eq(policies.id, true));
}

export async function checkOriginAllowed(origin: string): Promise<boolean> {
  const policy = await getPolicies();
  if (policy.allowedOrigins.length === 0) {
    return true; // If no restrictions, allow all
  }
  return policy.allowedOrigins.some((allowed) => origin.includes(allowed));
}

