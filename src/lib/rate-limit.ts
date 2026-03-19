import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { logRateLimitExceeded } from "@/lib/observability";

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  route: string;
  key: string;
  limit?: number;
  windowMs?: number;
};

declare global {
  var apiRateLimitStore: Map<string, Bucket> | undefined;
}

const store = global.apiRateLimitStore ?? new Map<string, Bucket>();

if (!global.apiRateLimitStore) {
  global.apiRateLimitStore = store;
}

export function getRateLimitKey(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || "local";
}

export function checkRateLimit(options: RateLimitOptions) {
  if (!env.RATE_LIMIT_ENABLED) {
    return { ok: true as const, remaining: Number.POSITIVE_INFINITY, resetAt: Date.now() };
  }

  const limit = options.limit ?? env.RATE_LIMIT_MAX_REQUESTS;
  const windowMs = options.windowMs ?? env.RATE_LIMIT_WINDOW_MS;
  const now = Date.now();
  const bucketKey = `${options.route}:${options.key}`;

  const current = store.get(bucketKey);
  if (!current || current.resetAt <= now) {
    store.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { ok: true as const, remaining: Math.max(limit - 1, 0), resetAt: now + windowMs };
  }

  if (current.count >= limit) {
    logRateLimitExceeded({
      route: options.route,
      key: options.key,
      limit,
      windowMs,
    });
    return { ok: false as const, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  store.set(bucketKey, current);
  return { ok: true as const, remaining: Math.max(limit - current.count, 0), resetAt: current.resetAt };
}