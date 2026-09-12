# Vertex — PostHog event tracking for search, video and progress

## Goal

Instrument the features built since the basic PostHog setup so the engagement
moments AGENTS.md §7 calls for are actually measurable: search performed with
its query, a search result opened with its result type, a video play, watch
depth, resume, lesson completion, and the catalog/course views that open the
funnel. Capture server side where the action is server side. Carry no
personally identifiable content beyond the Clerk user id.

## Skills and docs read

- `AGENTS.md` §5 (boundaries), §7 (what to instrument), §12 (key handling).
- `.claude/skills/integration-nextjs-app-router/SKILL.md`, `references/1-begin.md`,
  `references/2-edit.md` — PostHog's own Next.js App Router guidance:
  snake_case events, no PII in `capture()` properties, capture in event handlers
  not in `useEffect`-on-state, `posthog-node` for server routes with
  `flushAt: 1` / `flushInterval: 0` and an awaited flush, and
  `X-POSTHOG-DISTINCT-ID` / `X-POSTHOG-SESSION-ID` to correlate client and
  server.

## Code inspected

- `instrumentation-client.ts` — init, `defaults: "2026-01-30"`, autocapture and
  `capture_exceptions` on, dev-loud / prod-noop guard on missing env.
- `app/lib/posthog-client.ts` — `captureEvent` wrapper, env-guarded.
- `app/components/PostHogIdentity.tsx` — identifies on Clerk user, **currently
  sends `email` and `name` as person properties**.
- `app/components/ui/ViewTracker.tsx`, `ui/AnalyticsLink.tsx` — the two existing
  capture primitives.
- Existing captures: `search_performed`, `search_result_clicked`,
  `lesson_viewed`, `lesson_video_played`, `lesson_tab_selected`,
  `lesson_module_toggled`, `lesson_selected`, `lesson_navigated`,
  `course_module_toggled`, `course_outline_toggled`, `learning_started`.
- `app/api/search/route.ts` — the only server route; streams NDJSON, no capture.
- `app/components/lesson/LessonPlayer.tsx` — poster facade over a provider
  iframe; no player JS API is wired up.
- `sanity/lib/video.ts` — `parseStartSeconds` (the `?t=` deep link) and
  `videoEmbed`.
- `app/courses/page.tsx`, `app/courses/[slug]/page.tsx` — **no view events at
  all**, though §7 asks for catalog views.

## Decisions and assumptions

1. **Watch depth is an elapsed-time heartbeat** (the user chose this over a
   provider `postMessage` bridge or the official player SDKs). A 1s timer runs
   from the play click, pauses while `document.hidden`, and is measured against
   the lesson's stored `durationSeconds`. It is blind to pause, seek and
   buffering inside the player, so every depth event carries `estimated: true`
   and completion is a *watch* signal, not a learner assertion.
2. **There is no progress backend.** No progress document type, no server write
   route, and no "mark complete" control exist. So:
   - `lesson_completed` fires from watch depth crossing 95%, with
     `source: "video_watched"` and `estimated: true`.
   - `lesson_resume_used` fires when the lesson page loads with a valid `?t=`
     greater than zero — the only real resume affordance in the product today.
   - The course CTA keeps `learning_started`, gaining a `resumed` boolean.
   When progress lands, these events keep their names and gain a truthful
   `source`.
3. **`search_result_clicked` is renamed `search_result_opened`** to match the
   requested taxonomy and because the link opens a destination rather than
   merely registering a click. No dashboard depends on the old name yet.
4. **Property names normalise to snake_case** everywhere. `search_performed`
   and `search_result_clicked` currently mix camelCase (`resultCount`,
   `lessonSlug`) with the snake_case used elsewhere; PostHog's guidance is
   snake_case for both names and properties.
5. **Server side means the search route.** It is the only place a meaningful
   action happens on the server, so it gets `posthog-node`. The client sends its
   distinct and session ids as headers; the route prefers the Clerk `userId`
   when signed in so client and server events land on one person.
6. **The server reuses the public project token.** It is public by design
   (AGENTS.md §12); no private PostHog API key is introduced. `POSTHOG_HOST`
   falls back to `NEXT_PUBLIC_POSTHOG_HOST` — the server needs no reverse proxy.
7. **PII: `identify()` drops `email` and `name`.** The instruction is "nothing
   personally identifiable beyond the Clerk user id", which is stricter than
   PostHog's default advice of putting PII in person properties. Only
   `posthog.identify(user.id)` remains.
8. **The raw search query is kept**, because it was explicitly requested and is
   the analytic core of the feature — even though it is user-entered text. See
   "Needs your attention".
9. `capture()` is called from event handlers, never from a `useEffect` reacting
   to state. The two exceptions are genuine external-system syncs: the mount-time
   `ViewTracker` and the playback heartbeat's timer.

## Event taxonomy

### Client

| Event | Fired in | Properties |
|---|---|---|
| `catalog_viewed` | `app/courses/page.tsx` | `course_count` |
| `course_viewed` | `app/courses/[slug]/page.tsx` | `course_slug`, `level`, `module_count`, `lesson_count`, `is_popular` |
| `lesson_viewed` (existing) | `app/lessons/[slug]/page.tsx` | + `duration_seconds`, `provider` |
| `search_submitted` | `HeroSearch` | `query`, `query_length`, `source` (`hero` or `compact`) |
| `search_performed` (existing) | `SearchResults` | `query`, `query_length`, `result_count`, `course_count`, `video_result_count`, `lesson_result_count`, `duration_ms`, `has_results` |
| `search_failed` | `SearchResults` | `query`, `reason`, `duration_ms` |
| `search_results_sorted` | `SearchResults` | `query`, `sort`, `result_count` |
| `search_result_opened` (renamed) | `VideoResultCard`, `LessonResultCard` | `query`, `result_type` (`video` or `lesson`), `rank`, `lesson_slug`, `course_slug`, `start_seconds` (video only) |
| `lesson_video_played` (existing) | `LessonPlayer` | `lesson_slug`, `course_slug`, `provider`, `start_seconds`, `duration_seconds`, `resumed` |
| `lesson_video_progressed` | `LessonPlayer` | `lesson_slug`, `course_slug`, `percent_watched` (25/50/75/95), `watched_seconds`, `duration_seconds`, `provider`, `estimated: true` |
| `lesson_completed` | `LessonPlayer` | `lesson_slug`, `course_slug`, `duration_seconds`, `source: "video_watched"`, `estimated: true` |
| `lesson_resume_used` | `LessonPlayer` | `lesson_slug`, `course_slug`, `start_seconds`, `percent_into_lesson`, `source: "deep_link"` |
| `learning_started` (existing) | `CourseProgressBar` | `course_slug`, `lesson_slug`, `current_percent`, `resumed` |

Existing navigation events (`lesson_tab_selected`, `lesson_module_toggled`,
`lesson_selected`, `lesson_navigated`, `course_module_toggled`,
`course_outline_toggled`) keep their names; only their property keys are
normalised to snake_case and given `course_slug` where it is free to pass.

### Server (`app/api/search/route.ts`, via `posthog-node`)

| Event | Properties |
|---|---|
| `search_executed` | `query`, `query_length`, `result_count`, `course_count`, `video_result_count`, `lesson_result_count`, `duration_ms`, `model`, `step_count`, `status` (`ok`, `no_results`, `no_answer`, `error`, `aborted`), `signed_in` |
| `search_rate_limited` | `retry_after_seconds`, `signed_in` |
| `$exception` | via `captureException` on the unexpected-error path |

Every server event carries `$session_id` from the `X-POSTHOG-SESSION-ID` header
so it joins the browser session and its replay.

## Files to touch

**New**

- `app/lib/posthog-server.ts` — env-guarded `posthog-node` singleton
  (`flushAt: 1`, `flushInterval: 0`, `enableExceptionAutocapture: true`), a
  `captureServerEvent` helper that awaits `flush()`, and `distinctIdFor(request)`
  resolving Clerk `userId` then `X-POSTHOG-DISTINCT-ID` then anonymous.
- `app/lib/analytics/watch-depth.ts` — the heartbeat hook.
- `.posthog-events.json` — the plan file the PostHog wizard reads.

**Changed**

- `package.json` — add `posthog-node`.
- `.env.example` — document `POSTHOG_HOST` (optional, server-only override).
- `app/lib/posthog-client.ts` — add `distinctId()` / `sessionId()` readers for
  the search fetch headers.
- `app/components/PostHogIdentity.tsx` — drop `email` and `name`.
- `app/courses/page.tsx`, `app/courses/[slug]/page.tsx` — `ViewTracker`.
- `app/lessons/[slug]/page.tsx` — extra `lesson_viewed` properties, pass
  `courseSlug` to `LessonPlayer`.
- `app/components/ui/HeroSearch.tsx` — `search_submitted`.
- `app/components/search/SearchResults.tsx` — normalised `search_performed`,
  plus `search_failed`, `search_results_sorted`, and the two PostHog headers on
  the `/api/search` fetch.
- `app/components/search/VideoResultCard.tsx`, `LessonResultCard.tsx` — rename
  to `search_result_opened`, snake_case properties, add `result_type`.
- `app/components/lesson/LessonPlayer.tsx` — resume event, richer play event,
  watch-depth milestones, completion.
- `app/components/course/CourseProgressBar.tsx`,
  `app/components/course/CourseContent.tsx`,
  `app/components/lesson/LessonTabs.tsx`, `LessonSidebar.tsx`,
  `LessonFooterNav.tsx` — property normalisation.
- `app/api/search/route.ts` — server captures and exception capture.

## Requirements

- Event names snake_case, past tense, `object_verb` shaped. Properties
  snake_case. No PostHog call outside the env guard.
- No `useEffect` reacting to state in order to capture; handlers own their
  events. The heartbeat and `ViewTracker` are external-system syncs.
- Each watch-depth milestone fires at most once per mounted player, guarded by a
  ref, and the whole set resets when the lesson changes.
- The heartbeat clears on unmount, on tab hide, and once 95% is reached; it
  never runs when `durationSeconds` is unknown.
- A missing PostHog configuration must not break the page, the route or the
  build — dev throws loudly with the prescribed message, production is a no-op.
- `posthog-node` is imported only from server modules; `posthog-js` only from
  client ones.

## Security considerations

- No token or key is added to the browser. The server uses the same public
  project token; no private PostHog API key is introduced (AGENTS.md §12).
- `identify()` carries the Clerk user id and nothing else. No email, no name.
- Server events never carry the Clerk session token, the Sanity read token, the
  MCP URL, or any request header beyond the two PostHog correlation ids.
- The `X-POSTHOG-DISTINCT-ID` header is client-supplied and therefore
  untrusted: it is used only when the request is unauthenticated, and the Clerk
  `userId` always wins when present.
- `start_seconds` reaching an event is the already-clamped value from
  `parseStartSeconds`, not the raw query parameter.
- Events carry slugs and counts, never Portable Text bodies, note content, or
  transcript text.

## Acceptance criteria

1. Searching from the home hero emits `search_submitted`, then `search_performed`
   on the results page with a real `result_count`, `course_count` and
   `duration_ms`; a failing search emits `search_failed` instead.
2. `/api/search` emits a matching server-side `search_executed` on the same
   person and session as the browser events.
3. Opening either card kind emits `search_result_opened` with a `result_type` of
   `video` or `lesson` and the correct `rank`.
4. Pressing play emits `lesson_video_played`; leaving it running emits
   `lesson_video_progressed` at 25/50/75/95 and then `lesson_completed` once.
5. Arriving from a video result emits `lesson_resume_used` with the matched
   second.
6. `/courses` emits `catalog_viewed` and a course page emits `course_viewed`.
7. No event property and no person property contains an email, a name, or any
   identifier other than the Clerk user id.
8. With `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` unset, the app builds and the search
   route still answers.

## Checks to run

From the web workspace:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build` (a route and server module changed)
- `npm run dev` for the manual pass below

No Studio change, so no Studio deploy or import.

## Manual test steps

1. `npm run dev`, open the site with the PostHog debug panel:
   `http://localhost:3000/?__posthog_debug=true`. Sign in with Clerk.
2. In the PostHog console output, confirm `identify` carries the Clerk user id
   and **no** `email` or `name`.
3. Visit `/courses` — expect `catalog_viewed`. Open a course — `course_viewed`.
4. Press "Start Learning" — `learning_started` with `resumed: false`.
5. From the hero, search `data fetching` — `search_submitted`, then
   `search_performed` with a non-zero `result_count`.
6. Change the sort control — `search_results_sorted`.
7. Click a **Video** card's "Watch from …" — `search_result_opened` with
   `result_type: "video"` and a `start_seconds`; the lesson page then emits
   `lesson_resume_used` and `lesson_viewed`.
8. Press play — `lesson_video_played`. Leave the tab focused and let it run past
   a quarter of the lesson's duration — `lesson_video_progressed` with
   `percent_watched: 25`. (Pick a short lesson, or temporarily seed a lesson with
   a small `durationSeconds`, to reach 95% and `lesson_completed`.)
9. Switch to another browser tab mid-playback, wait, come back: the accumulated
   `watched_seconds` must not have advanced while hidden.
10. Click a **Lesson** card — `search_result_opened` with
    `result_type: "lesson"`.
11. In the PostHog activity feed, confirm the server `search_executed` appears
    against the same person as step 5's `search_performed`, and that its
    `$session_id` matches the browser session.
12. Unset `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, run `npm run build` and
    `npm start`: the site renders and search answers, with no PostHog traffic.
