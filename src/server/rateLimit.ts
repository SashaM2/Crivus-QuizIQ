import { checkOriginAllowed } from "./policies";
import { getPolicies } from "./policies";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

const CLEANUP_INTERVAL = 60 * 1000; // 1 minute

setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  }
}, CLEANUP_INTERVAL);

export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const entry = store[identifier];

  if (!entry || entry.resetAt < now) {
    store[identifier] = {
      count: 1,
      resetAt: now + windowMs,
    };
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

export async function checkCollectRateLimit(
  origin: string,
  ip: string,
  sid: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const policy = await getPolicies();
  const limit = policy.maxCollectRpsPerOrigin;
  const identifier = `collect:${origin}:${ip}:${sid}`;
  return checkRateLimit(identifier, limit, 1000); // 1 second window
}

