# Intelligent search — Context MCP, search API, results page

## Goal

Make Vertex's search real. A learner types a plain-language query, and `/search?q=…`
returns a full page of ranked, grounded result cards over the course and lesson
content in Sanity.

Three pieces, in the order they depend on each other:

1. **The Sanity Context MCP connection** — a deployed Studio, a `sanity.agentContext`
   configuration document, and a server-side HTTP client that fetches initial context
   and the MCP tools.
2. **The server-side search API** — `POST /api/search`. It injects the schema and the
   inline system prompt, lets the LLM write GROQ through the MCP, then **hydrates the
   returned ids from Sanity itself** and streams the finished cards back.
3. **The results page** — `/search`, a client component rendering the ranked cards,
   the count, the sort control, and the empty state, matching `design/vertex-search.png`.

## Scope decision (agreed with the user)

`design/vertex-search.png` shows two result kinds: **VIDEO** (a lesson's video matched
at a specific second) and **LESSON** (a lesson matched on its own topic).

Video results are **out of scope for this task**. They require `video` documents
(chapters + timestamped transcript chunks, AGENTS.md §8/§9), and this repo has
neither the `video` schema type nor the §9 ingestion pipeline. Asked to choose, the
user picked **lessons only for now**.

So: this task ships **LESSON result cards only**. The VIDEO card, the chapter→transcript
timestamp resolution (§7), and the "Watch from 12:45" action are deliberately unbuilt
and will land with the video-ingestion work. Nothing here fakes a timestamp.

Everything else on the search page — the header, the count, the search field, the sort
control, the empty state — is built in full.

## Skills read

- `.claude/skills/create-agent-with-sanity-context/SKILL.md` and its
  `references/nextjs-agent.md` + reference route at
  `references/ecommerce/app/src/app/api/chat/route.ts` — MCP URL shapes, bearer auth,
  `/initial-context` fetch + cache, `mcpClient.tools()`, excluding `initial_context`
  from the tool list, `createMCPClient` HTTP transport, and the tested package versions.
- `.claude/skills/dial-your-context/SKILL.md` — Instructions are **pure deltas**: only
  what the auto-generated schema does not already make obvious. Plus `groqFilter`
  scoping.
- `.claude/skills/shape-your-agent/SKILL.md` — system prompt shape, explicit forbidden
  behaviours, formatting rules.
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` — Route
  Handlers are uncached by default; `POST` is never cached; `RouteContext` typing.

## Code inspected

- `sanity/lib/client.ts`, `token.ts`, `fetch.ts` — the existing server-only read path.
  `client` already carries `SANITY_API_READ_TOKEN` and `perspective: 'published'`.
- `sanity/lib/queries.ts` — every query is a `defineQuery` constant feeding TypeGen.
  Existing `imageFragment` and `courseCardFragment` to reuse.
- `sanity/lib/derive.ts` — `courseOutline()` already derives `Lesson 5.1` labels and
  module numbers from array order. The hydration step reuses it rather than re-deriving.
- `studio/schemaTypes/` — `course`, `lesson`, `instructor`, `category` documents;
  `courseModule`, `learningOutcome`, `lessonResource`, `blockContent` objects. **No
  `video` type.**
- `app/components/ui/` — `Badge` (already has a `lesson` and a `video` variant),
  `Button`/`ButtonLink`, `Select`, `Input`, `HeroSearch` (explicitly "gets wired to the
  search route with the search work"), `CourseCover`, `ViewTracker`, `AnalyticsLink`.
- `app/lib/posthog-client.ts` — `captureEvent`, no-ops when the keys are absent.
- `app/courses/page.tsx`, `app/lessons/[slug]/page.tsx` — page shell: `page-hatch`
  wrapper, `max-w-[1360px]` bordered column, `SiteHeader activeHref`.
- `proxy.ts` — `clerkMiddleware()` with no route protection; browsing is public (§7).

## Live checks already run

- `POST https://api.sanity.io/v2026-03-03/context/mcp/xxdqhkai/production` →
  **HTTP 400**: *"Only datasets with deployed Studio applications are supported. Please
  deploy a Studio (v5.1.0+) for this project/dataset."* This confirms AGENTS.md §12 —
  the Studio must be deployed before any of this works. `sanity deploy` is a
  prerequisite step of this task, not an afterthought.
- `npm info @sanity/context` → **v2.0.0, peer `sanity: ^6`**. The Studio here is
  `sanity ^5.31.2`, so the plugin lags the Studio major. Per §12 and §6: **do not
  install it.** The Context document is created by import, and Conversation Insights
  stays unavailable.

## Decisions and assumptions

1. **Grounding by hydration, not by trust.** The LLM never writes the card copy. It
   returns only a ranked list of `{lessonId, matchedOn, rank}`. The route then fetches
   each lesson and its parent course from Sanity with our own trusted GROQ query, and
   builds the cards from stored fields (`title`, `summary`, `keyPoints`,
   `durationSeconds`, the course title and cover, the derived `Lesson 5.1` label). Any
   id that does not resolve is dropped. This makes "never invent a course, lesson,
   price, duration, or timestamp" (§7, §11) structurally true rather than a hope.
2. **Streaming shape**: the route returns NDJSON over a `ReadableStream` —
   `{type:"status"}` while the agent queries, then one `{type:"results", …}` line, or
   `{type:"error"}`. Satisfies §5's "streams results back" while keeping hydration
   server-side. The client shows skeleton cards until the results line arrives.
3. **No cap on results** (§11). The model is told to return everything relevant; the
   hydration query is bounded at 60 ids purely as an abuse ceiling, not as a "handful".
4. **Sort control** defaults to `Most Relevant` (the agent's own ranking) with
   `Shortest first` / `Longest first` as alternatives. Re-sorting is client-side over
   the already-fetched set — no refetch, no second LLM call.
5. **Package versions** follow the skill's *tested* reference combination rather than
   the newest tags: `ai@^6`, `@ai-sdk/google@^3`, `@ai-sdk/mcp@^1`, `zod@^4`. `ai@7` is
   published, but the reference implementation and `@sanity/context`'s own peer range
   are both on the v6 line, and there is no v7 guidance in the skill to build against.
   `react-markdown@^10` is added per §6 for the agent's short reply line only.
6. **Provider**: Google Gemini via `@ai-sdk/google`, model id in `SEARCH_MODEL`,
   defaulting to `gemini-flash-lite-latest`. This is a deliberate deviation from AGENTS.md §6,
   which names the OpenAI provider: the user does not want to buy OpenAI credits, and
   §7 decisions hold "unless the user changes them". Gemini's AI Studio tier is free
   with no card and does multi-step tool calling, which the agent loop depends on.
   Nothing else is provider-specific — the MCP connection, the hydration and the UI
   are untouched by the swap, so reverting is a one-line change.
7. **Search stays public** (§7 — browsing is public, and search is not marked
   protected). Abuse is handled by input validation and a rate limit, not by auth.
8. **The Context document slug** is `vertex-search`; the MCP URL lives in
   `SANITY_CONTEXT_MCP_URL` so the document's configuration applies.
9. `HeroSearch` becomes a real form that navigates to `/search?q=…`; the same component
   is reused on the results page (design shows the identical field there).

## Files

**Studio workspace**

- `studio/scripts/context/context.ndjson` *(new)* — the `sanity.agentContext` document:
  slug `vertex-search`, `groqFilter`, `instructions`.
- `studio/scripts/context/import.mjs` *(new)* — imports it, mirroring
  `scripts/seed/import.mjs`.
- `studio/package.json` — add `context:import` script.
- `studio/README.md` — document the deploy + context import order.

**Web workspace**

- `package.json` — add `ai`, `@ai-sdk/google`, `@ai-sdk/mcp`, `zod`, `react-markdown`.
- `.env.example` — add `SANITY_CONTEXT_MCP_URL`, `GOOGLE_GENERATIVE_AI_API_KEY`, `SEARCH_MODEL`.
- `app/api/search/route.ts` *(new)* — the search API.
- `app/lib/search/mcp.ts` *(new)* — server-only: MCP client creation, cached
  `/initial-context` fetch.
- `app/lib/search/prompt.ts` *(new)* — the inline system prompt (§11 rules, duplicated
  from the Context document per §12).
- `app/lib/search/schema.ts` *(new)* — the Zod schema for the agent's structured output
  and the shared `SearchResult` types (importable from the client).
- `app/lib/search/hydrate.ts` *(new)* — server-only: ids → grounded cards.
- `app/lib/search/ratelimit.ts` *(new)* — server-only in-memory limiter.
- `sanity/lib/queries.ts` — add `SEARCH_LESSONS_BY_IDS_QUERY`.
- `app/search/page.tsx` *(new)* — the route shell (server component, reads `?q=`).
- `app/components/search/SearchResults.tsx` *(new)* — client component: fetch, stream,
  state, count, sort, empty state.
- `app/components/search/LessonResultCard.tsx` *(new)*.
- `app/components/search/SearchEmptyState.tsx` *(new)* — the "Can't find what you're
  looking for?" panel.
- `app/components/ui/HeroSearch.tsx` — wire to `/search`.
- `sanity.types.ts` — regenerated by TypeGen.

## Requirements

### Context MCP

- Deploy the Studio (`npx sanity deploy` in `studio/`) — the MCP refuses the dataset
  until then (verified above).
- `groqFilter`: `_type in ["course", "lesson", "instructor", "category"]`. Content types
  only — it keeps the agent out of anything else in the dataset.
- `instructions`: pure deltas only (dial-your-context), short. Must cover:
  - A lesson does not store its course; the course is found with
    `*[_type == "course" && references($lessonId)]`.
  - Module and lesson numbers are **not stored** — they come from array order, so never
    quote a "Lesson 5.1" from data.
  - `notes` is Portable Text and cannot be text-matched directly — match
    `pt::text(notes)`.
  - Text match is token-based: wildcard each keyword and OR them
    (`title match "fetch*" || title match "data*"`). Never match a whole phrase as one
    pattern.
  - `durationSeconds` is seconds, not minutes.
  - If `text::semanticSimilarity()` errors with embeddings not enabled, fall back to
    keyword matching (§12).
- Fetch `/initial-context` once and cache it in module scope; exclude the
  `initial_context` tool from the tools handed to the model.

### Search API (`POST /api/search`)

- Body `{ query: string }`, validated with Zod: trimmed, 2–200 chars. Reject otherwise
  with 400.
- Rate limit per IP (in-memory, e.g. 10 requests / minute) → 429. An LLM call per
  keystroke-sized request is a real cost surface on a public route.
- `createMCPClient` over HTTP to `SANITY_CONTEXT_MCP_URL` with
  `Authorization: Bearer ${SANITY_API_READ_TOKEN}`. **Always** `await mcpClient.close()`
  — in `onFinish` and in every error path.
- Agent loop: `generateText` with the MCP tools, `stopWhen: stepCountIs(8)`, plus a
  terminal tool `return_results` with **no `execute`**, whose Zod input is the ranked
  list. Reading the model's answer out of a typed tool call is what makes the output
  validated structured data rather than parsed prose.
- Hydrate: `SEARCH_LESSONS_BY_IDS_QUERY` over the returned ids (capped at 60), then
  reorder into the model's ranking, drop unresolved ids, derive the `Lesson 5.1` label
  with `courseOutline`/`findLesson`.
- Respond with NDJSON: `{type:"status"}` → `{type:"results", query, results,
  resultCount, courseCount, reply}` — or `{type:"error", message}`.
- Never return a whole transcript or a whole `notes` field to the model (§12). The
  system prompt tells it to project `pt::text(notes)[0...300]`.
- Missing `GOOGLE_GENERATIVE_AI_API_KEY` or `SANITY_CONTEXT_MCP_URL` → a 500 with a
  clear message, not a crash.

### Results page (`/search?q=…`)

Match `design/vertex-search.png` exactly at desktop, responsive down to mobile (§3).

- Eyebrow `SEARCH RESULTS`; heading `Results for "<query>"` with the query in
  primary-500 inside display-serif quotes; sub-line `Found 28 results across 8 courses`.
- The search field below the heading, prefilled with the query, resubmitting on enter.
- A row with `28 results` on the left and the sort `Select` on the right.
- Lesson cards: a left tile showing the lesson's key points as a bulleted list over a
  tinted panel with the course icon; the right side carrying the course icon + name,
  the `LESSON` badge top-right, the lesson title, the summary, `Module N`, and a
  `View lesson` action linking to `/lessons/<slug>`.
- Loading: skeleton cards while the stream is open.
- Empty / no matches: the "Can't find what you're looking for?" panel with
  `Browse all courses` → `/courses`. Same panel under a non-empty list, per the design.
- No `q`: render the page with the field focused and no results, not an error.

### Analytics

- `search_performed` `{query, resultCount}` on a completed search — once per query, not
  per render.
- `search_result_clicked` `{query, lessonSlug, rank}` via `AnalyticsLink`.

## Security

- `SANITY_API_READ_TOKEN` and `GOOGLE_GENERATIVE_AI_API_KEY` are read only inside the route and the
  server-only modules. `app/lib/search/mcp.ts`, `hydrate.ts` and `ratelimit.ts` all
  start with `import 'server-only'`; `schema.ts` stays dependency-free so the client can
  import the types.
- The browser never calls the MCP, never calls OpenAI, and holds no token (§5).
- The query string is validated and length-capped before it reaches the model.
- Results are rendered as React text, never as HTML. `react-markdown` is used only for
  the agent's one-line reply, with no raw-HTML plugin.
- GROQ written by the model runs through the MCP under a **viewer/read** token scoped by
  `groqFilter`. Our own hydration query is a static `defineQuery` with parameters — the
  model's output is never interpolated into GROQ.
- The route is `POST`, so Next does not cache it (route-handlers doc).

## Acceptance criteria

1. `curl -X POST localhost:3000/api/search -d '{"query":"data fetching"}'` streams a
   status line then a results line whose every `lessonId` exists in the dataset.
2. `/search?q=data%20fetching` renders ranked LESSON cards matching the design, with a
   real count and course count.
3. Every card links to a lesson page that loads.
4. A nonsense query renders the empty state, not an error and not invented results.
5. A query of 1 char → 400; 11 rapid queries → 429.
6. No token, MCP URL, or model name appears in the client bundle
   (`grep -r` over `.next/static`).
7. Type check, lint, and a production build all pass.
8. The MCP `tools/list` probe returns tools (i.e. the Studio deploy took effect).

## Checks to run

- `studio/`: `npx sanity deploy`, then `npm run typegen`, then `npm run context:import`.
- Re-run the `tools/list` curl probe against the deployed dataset.
- `web/`: `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run dev`.
- Verify the search route against the **live** MCP endpoint (§13), not a mock.

## Manual test steps

1. In `studio/`: `npx sanity deploy`, then `npm run context:import`.
2. Add `GOOGLE_GENERATIVE_AI_API_KEY`, `SANITY_CONTEXT_MCP_URL`, `SEARCH_MODEL` to `.env.local`.
3. `npm run dev`, open `http://localhost:3000`.
4. Type `data fetching` into the hero field, press enter → lands on
   `/search?q=data+fetching`.
5. Watch skeletons, then ranked lesson cards with a count line.
6. Click a card → the lesson page for that lesson opens.
7. Search `qwertyuiop` → the empty state with `Browse all courses`.
8. In PostHog Live Events, confirm `search_performed` and `search_result_clicked`.
9. Narrow the browser to 390px → cards stack, nothing overflows.

## Known blockers for the user

- **The Studio is not deployed** — the MCP returns HTTP 400 until it is, and
  `sanity deploy` needs an interactive `sanity login`.
- **`GOOGLE_GENERATIVE_AI_API_KEY` must be in `.env.local`** — the search route cannot
  run without it. A free key comes from https://aistudio.google.com/apikey.
- **`@sanity/context` Studio plugin is not installable** (peer `sanity ^6`, Studio is
  `^5`), so the Context document is managed by import and Conversation Insights is
  unavailable (§12).
