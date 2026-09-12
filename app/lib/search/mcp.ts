import "server-only";

import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";

import { readToken } from "@/sanity/lib/token";

/**
 * The Sanity Context MCP connection (AGENTS.md §5, §10).
 *
 * Server-only: the bearer is the private dataset's read token, and the browser
 * never speaks to the MCP.
 */

function mcpUrl(): string {
  const url = process.env.SANITY_CONTEXT_MCP_URL;

  if (!url) {
    throw new Error(
      "Missing environment variable: SANITY_CONTEXT_MCP_URL. See .env.example.",
    );
  }

  return url;
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${readToken}` };
}

/** Opens an HTTP transport to the Context MCP. The caller must close it. */
export async function createSearchMCPClient(): Promise<MCPClient> {
  return createMCPClient({
    transport: { type: "http", url: mcpUrl(), headers: authHeaders() },
  });
}

let cachedInitialContext: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/** `/initial-context` sits on the MCP path, before any query params. */
function initialContextUrl(): string {
  const url = new URL(mcpUrl());
  url.pathname = `${url.pathname.replace(/\/$/, "")}/initial-context`;
  return url.toString();
}

/**
 * The compressed schema overview, injected into the system prompt so the agent
 * knows the content model without spending a tool call on it.
 *
 * Cached in module scope: it is the same for every learner, and re-fetching it
 * per search would add a round trip to every query. A refresh failure keeps the
 * previous value rather than dropping the agent's schema on the floor — which
 * also means an instructions edit lands on the next cold fetch, within the TTL.
 */
export async function fetchInitialContext(
  signal?: AbortSignal,
): Promise<string | null> {
  const isStale = Date.now() - cachedAt > CACHE_TTL_MS;
  if (cachedInitialContext && !isStale) return cachedInitialContext;

  try {
    const response = await fetch(initialContextUrl(), {
      headers: authHeaders(),
      cache: "no-store",
      signal,
    });

    if (response.ok) {
      cachedInitialContext = await response.text();
      cachedAt = Date.now();
    }
  } catch {
    // Fall through to whatever is cached. The agent still has the system
    // prompt and can call `schema_explorer` itself.
  }

  return cachedInitialContext;
}
