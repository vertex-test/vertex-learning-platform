"use client";

import { useEffect, useRef } from "react";

import { captureEvent } from "@/app/lib/posthog-client";

/**
 * Fires one PostHog event when a page mounts (AGENTS.md §7 — instrument the
 * moments that show engagement). Renders nothing.
 *
 * The ref guards React's development double-effect and any re-render, so a
 * single view never captures twice.
 */
export function ViewTracker({
  eventName,
  properties,
}: {
  eventName: string;
  properties?: Record<string, unknown>;
}) {
  const captured = useRef<string | null>(null);
  const key = `${eventName}:${JSON.stringify(properties ?? {})}`;

  useEffect(() => {
    if (captured.current === key) return;
    captured.current = key;
    captureEvent(eventName, properties);
    // `key` already encodes both inputs; depending on `properties` directly
    // would re-fire on every new object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}
