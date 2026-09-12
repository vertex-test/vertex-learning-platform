import "server-only";

/**
 * A per-IP limiter for the search route.
 *
 * Every request there costs an LLM call, and the route is public (AGENTS.md §7
 * keeps browsing public, and search is not a protected feature), so the ceiling
 * is what stops a public endpoint from being a billable one.
 *
 * In-memory and per-instance on purpose: it is a cost guard, not a security
 * control. A multi-instance deploy wants a shared store instead.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
/** Stops the map from growing without bound under a spray of unique IPs. */
const MAX_TRACKED = 10_000;

const hits = new Map<string, number[]>();

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the oldest hit in the window expires. */
  retryAfter: number;
};

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter(
    (time) => now - time < WINDOW_MS,
  );

  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    const oldest = recent[0];
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000)),
    };
  }

  recent.push(now);
  hits.set(key, recent);

  if (hits.size > MAX_TRACKED) {
    for (const [entryKey, times] of hits) {
      if (times.every((time) => now - time >= WINDOW_MS)) hits.delete(entryKey);
    }

    // Dropping expired entries is not enough on its own: a spray of unique
    // addresses inside one window leaves every entry fresh, and the map would
    // grow without bound. Map iterates in insertion order, so the entries that
    // go are the ones tracked longest ago.
    for (const entryKey of hits.keys()) {
      if (hits.size <= MAX_TRACKED) break;
      if (entryKey !== key) hits.delete(entryKey);
    }
  }

  return { allowed: true, retryAfter: 0 };
}

/** The caller's address, as far as the proxy in front of us reports it. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return request.headers.get("x-real-ip") ?? "unknown";
}
