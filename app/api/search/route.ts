import { google } from "@ai-sdk/google";
import type { MCPClient } from "@ai-sdk/mcp";
import { generateText, stepCountIs, tool } from "ai";

import { countCourses, hydrateResults } from "@/app/lib/search/hydrate";
import { createSearchMCPClient, fetchInitialContext } from "@/app/lib/search/mcp";
import { buildSearchSystemPrompt } from "@/app/lib/search/prompt";
import { checkRateLimit, clientKey } from "@/app/lib/search/ratelimit";
import {
  agentResultsSchema,
  searchRequestSchema,
  type AgentResults,
  type SearchStreamEvent,
} from "@/app/lib/search/schema";

/**
 * The search API (AGENTS.md §5): the only place that talks to the Context MCP
 * and the LLM. The browser holds no token and never reaches either.
 *
 * POST is never cached by Next.js, so no cache directives are needed here.
 */

/** Enough steps for an initial query, a broadening retry, and the answer. */
const MAX_STEPS = 6;
/**
 * After this many steps the agent must answer with what it has. Left to
 * itself a small model will keep re-running near-identical queries until it
 * runs out of steps and returns nothing, so the terminal tool is forced rather
 * than merely requested.
 */
const QUERY_STEPS = 3;
const DEFAULT_MODEL = "gemini-flash-lite-latest";

/**
 * The agent's answer arrives as a typed tool call rather than as prose: there
 * is no `execute`, so the model calling it ends the run and hands us an object
 * Zod has already validated (AGENTS.md §6).
 */
const returnResults = tool({
  description:
    "Report the lessons that match the learner's query. Call this exactly once, as your final action.",
  inputSchema: agentResultsSchema,
});

function ndjson(event: SearchStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

function errorResponse(message: string, status: number, headers?: HeadersInit) {
  return Response.json({ type: "error", message }, { status, headers });
}

/**
 * The `return_results` call the agent made, if any.
 *
 * Scans every step: `result.toolCalls` holds only the final step's calls, so a
 * terminal call made earlier would be invisible there.
 */
function agentAnswer(
  toolCalls: { toolName: string; input: unknown }[],
): AgentResults | null {
  for (const call of [...toolCalls].reverse()) {
    if (call.toolName !== "return_results") continue;

    const parsed = agentResultsSchema.safeParse(call.input);
    if (parsed.success) return parsed.data;
  }

  return null;
}

export async function POST(request: Request) {
  const limit = checkRateLimit(clientKey(request));
  if (!limit.allowed) {
    return errorResponse("Too many searches. Try again in a moment.", 429, {
      "Retry-After": String(limit.retryAfter),
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  const parsed = searchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Enter a search of 2 to 200 characters.", 400);
  }

  const { query } = parsed.data;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return errorResponse(
      "Search is not configured: GOOGLE_GENERATIVE_AI_API_KEY is not set.",
      500,
    );
  }
  if (!process.env.SANITY_CONTEXT_MCP_URL) {
    return errorResponse(
      "Search is not configured: SANITY_CONTEXT_MCP_URL is not set.",
      500,
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let mcpClient: MCPClient | null = null;

      try {
        controller.enqueue(ndjson({ type: "status", message: "Searching courses…" }));

        const [client, initialContext] = await Promise.all([
          createSearchMCPClient(),
          fetchInitialContext(),
        ]);
        mcpClient = client;

        // The schema overview is already in the system prompt; leaving
        // `initial_context` in invites a redundant call on every search.
        const mcpTools = Object.fromEntries(
          Object.entries(await mcpClient.tools()).filter(
            ([name]) => name !== "initial_context",
          ),
        );

        const result = await generateText({
          model: google(process.env.SEARCH_MODEL || DEFAULT_MODEL),
          system: buildSearchSystemPrompt(initialContext),
          prompt: `Find every lesson that teaches: ${query}`,
          tools: { ...mcpTools, return_results: returnResults },
          stopWhen: stepCountIs(MAX_STEPS),
          prepareStep: ({ stepNumber }) =>
            stepNumber >= QUERY_STEPS
              ? {
                  activeTools: ["return_results"],
                  toolChoice: {
                    type: "tool" as const,
                    toolName: "return_results",
                  },
                }
              : {},
        });

        const answer = agentAnswer(
          result.steps.flatMap((step) => step.toolCalls),
        );

        if (!answer) {
          console.warn("[search] no return_results call", {
            finishReason: result.finishReason,
            steps: result.steps.length,
            toolNames: result.steps.flatMap((step) =>
              step.toolCalls.map((call) => call.toolName),
            ),
            text: result.text.slice(0, 500),
          });

          controller.enqueue(
            ndjson({
              type: "error",
              message: "Search could not complete. Try a different query.",
            }),
          );
          return;
        }

        // Everything the learner reads is looked up here, from stored data.
        const results = await hydrateResults(answer);

        controller.enqueue(
          ndjson({
            type: "results",
            query,
            results,
            resultCount: results.length,
            courseCount: countCourses(results),
            reply: answer.reply || null,
          }),
        );
      } catch (error) {
        console.error("[search]", error);
        controller.enqueue(
          ndjson({ type: "error", message: "Search is unavailable right now." }),
        );
      } finally {
        await mcpClient?.close().catch(() => {});
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
