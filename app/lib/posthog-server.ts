import "server-only";

import { auth } from "@clerk/nextjs/server";
import { PostHog } from "posthog-node";

/**
 * Server-side PostHog (AGENTS.md §5, §7): the capture side for actions that
 * happen on the server, which today means the search route.
 *
 * The project token is public by design (§12), so the server reuses the same
 * one the browser holds rather than introducing a private API key. `POSTHOG_HOST`
 * exists only so the server can bypass a browser-facing reverse proxy — it is
 * not needed for ingestion.
 */

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST;

/** Headers posthog-js sets on its fetch so server events join the same person. */
export const POSTHOG_DISTINCT_ID_HEADER = "x-posthog-distinct-id";
export const POSTHOG_SESSION_ID_HEADER = "x-posthog-session-id";

let client: PostHog | null = null;

/**
 * The singleton, or `null` when PostHog is not configured.
 *
 * A missing configuration is never allowed to break the route, but it is not
 * allowed to be silent either: development throws so the gap is noticed, and
 * production degrades to a no-op.
 */
function posthogServer(): PostHog | null {
  if (!projectToken || !host) {
    if (process.env.NODE_ENV === "development") {
      const missingVariable = !projectToken
        ? "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"
        : "NEXT_PUBLIC_POSTHOG_HOST";

      throw new Error(
        `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
      );
    }

    return null;
  }

  if (!client) {
    // A Next.js route handler is torn down per invocation, so the SDK's default
    // batching would drop the event before it ever left the process. Sending on
    // every capture and awaiting the flush below is what actually delivers it.
    client = new PostHog(projectToken, {
      host,
      flushAt: 1,
      flushInterval: 0,
      enableExceptionAutocapture: true,
    });
  }

  return client;
}

/**
 * Who this request belongs to.
 *
 * The Clerk user id always wins: the distinct-id header is client-supplied and
 * therefore untrusted, and is used only to keep a signed-out learner's server
 * events on the same anonymous person as their browser events.
 */
export async function distinctIdFor(request: Request): Promise<{
  distinctId: string;
  sessionId: string | null;
  signedIn: boolean;
}> {
  const sessionId = request.headers.get(POSTHOG_SESSION_ID_HEADER);

  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    // Not every deployment runs the route behind Clerk middleware; an
    // unidentifiable caller is not a reason to fail the search.
  }

  if (userId) return { distinctId: userId, sessionId, signedIn: true };

  const fromBrowser = request.headers.get(POSTHOG_DISTINCT_ID_HEADER);
  return {
    distinctId: fromBrowser?.trim() || "anonymous",
    sessionId,
    signedIn: false,
  };
}

type Identity = Awaited<ReturnType<typeof distinctIdFor>>;

/**
 * Captures one server event and waits for it to leave the process.
 *
 * `$session_id` ties the event to the browser session, so a server-side search
 * lines up with the session replay that produced it.
 */
export async function captureServerEvent(
  identity: Identity,
  event: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  const posthog = posthogServer();
  if (!posthog) return;

  posthog.capture({
    distinctId: identity.distinctId,
    event,
    properties: {
      ...properties,
      ...(identity.sessionId ? { $session_id: identity.sessionId } : {}),
    },
  });

  try {
    await posthog.flush();
  } catch {
    // Analytics must never take the response down with it.
  }
}

/** Reports a server-side failure to PostHog's error tracking. */
export async function captureServerException(
  identity: Identity,
  error: unknown,
  properties: Record<string, unknown> = {},
): Promise<void> {
  const posthog = posthogServer();
  if (!posthog) return;

  posthog.captureException(
    error instanceof Error ? error : new Error(String(error)),
    identity.distinctId,
    {
      ...properties,
      ...(identity.sessionId ? { $session_id: identity.sessionId } : {}),
    },
  );

  try {
    await posthog.flush();
  } catch {
    // As above.
  }
}
