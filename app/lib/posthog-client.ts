"use client";

import posthog from "posthog-js";

function configured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
      process.env.NEXT_PUBLIC_POSTHOG_HOST,
  );
}

export function captureEvent(
  eventName: string,
  properties?: Record<string, unknown>,
) {
  if (!configured()) {
    return;
  }

  posthog.capture(eventName, properties);
}

/**
 * The ids a server route needs to attribute its own events to this person and
 * this session (`app/lib/posthog-server.ts`). Sent as headers on the search
 * fetch; both are analytics identifiers, never credentials.
 */
export function analyticsHeaders(): Record<string, string> {
  if (!configured()) return {};

  const headers: Record<string, string> = {};

  try {
    const distinctId = posthog.get_distinct_id();
    if (distinctId) headers["X-POSTHOG-DISTINCT-ID"] = distinctId;

    const sessionId = posthog.get_session_id();
    if (sessionId) headers["X-POSTHOG-SESSION-ID"] = sessionId;
  } catch {
    // posthog-js has not finished initialising; the server falls back to an
    // anonymous distinct id rather than the request failing.
  }

  return headers;
}
