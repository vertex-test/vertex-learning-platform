# Search page — VIDEO moment results wired to Sanity

## Goal

Finish `/search` against `design/vertex-search.png`. The page already ships LESSON result
cards; the design's other result kind — **VIDEO**, a lesson's video matched at a specific
second, with a thumbnail, a play affordance, the matched timecode and a "Watch from 12:45"
action — was deferred by `prompts/vertex-intelligent-search.md` until `video` documents
existed. They exist now (49 in the dataset, 28 with chapters), so this task lands the
second result kind and the merged, ranked list the design shows.

Everything on a card stays stored Sanity content. The model chooses which lesson and which
second; it never writes copy and never states a timestamp we have not verified against the
`video` document (AGENTS.md §7, §11).

## Skills / docs read

- `AGENTS.md` §5 (boundaries), §7 (two-stage timestamp resolution, embeds, grounding),
  §8 (the `video` shape), §11 (how search must behave), §12 (never return whole chunk
  arrays to the model; critical rules in both prompt and Context doc), §13 (checks).
- `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md` — `next/image` with
  `fill` + `sizes` + `placeholder="blur"`, the pattern `CourseCover` and `LessonPlayer`
  already use for Sanity assets. No new route or server module is introduced, so no
  routing or data-fetching docs apply.
- `.claude/skills/dial-your-context/SKILL.md` — the Context document already carries the
  video rules (`groqFilter` includes `video`; instructions cover chapters-first, never
  project arrays whole). It needs **no** change, so no re-import.

## Code inspected

- `app/search/page.tsx` — server shell; reads `?q=`, trims to 200 chars, renders
  `<SearchResults query>`. Unchanged by this task.
- `app/components/search/SearchResults.tsx` — client; reads the NDJSON stream, holds the
  heading, count row, `Select` sort, skeletons and the empty-state panel. Renders
  `LessonResultCard` for every result today.
- `app/components/search/LessonResultCard.tsx` — the LESSON card, already matching the
  design's rows 4–5. Untouched except for the discriminated-union type.
- `app/lib/search/schema.ts` — `agentMatchSchema` (lessonId + matchedOn),
  `agentResultsSchema`, `LessonSearchResult`, `SearchResult`, the sort options, the stream
  events. Server/client shared, no server-only imports.
- `app/lib/search/hydrate.ts` — ids → `SEARCH_LESSONS_BY_IDS_QUERY` → cards, in the
  agent's order, dropping anything that does not resolve. `MAX_IDS = 60`.
- `app/lib/search/prompt.ts` — the inline system prompt; lesson-only rules today.
- `app/api/search/route.ts` — MCP + `generateText` + forced `return_results` tool, then
  `hydrateResults`. No change beyond what the schema change implies.
- `sanity/lib/queries.ts` — `SEARCH_LESSONS_BY_IDS_QUERY` projects `_id, title, slug,
  summary, keyPoints, durationSeconds` and the reverse-referenced course with its module
  outline. No `poster`, no `videoUrl` yet.
- `sanity/lib/derive.ts` — `courseOutline` / `findLesson` (derived "Lesson 5.1"),
  `formatTimestamp` (`765` → `12:45`), `formatDuration`.
- `sanity/lib/video.ts` — `parseStartSeconds`, `videoEmbed`; the lesson page already reads
  `?t=` and starts the provider embed at that second (`LessonPlayer`). **The deep-link
  target of this task already works** — nothing on the lesson page changes.
- `studio/schemaTypes/documents/video.ts` — `url`, `provider`, `chapters[{startSeconds,
  label}]`, `chunks[{startSeconds, text}]`; read-only, written by `scripts/ingest/`.
- `studio/scripts/context/prepare.mjs` — `groqFilter` already includes `video`; the
  instructions already carry the video rules.
- Live dataset check (GROQ over the read token): `videos: 49`, `withChapters: 28`,
  `lessons: 120`, `lessonsWithVideoDoc: 49`. So roughly 40% of lessons can produce a video
  moment; the rest can only ever be LESSON cards. That is expected, not a gap.

## Decisions and assumptions

1. **The agent reports a moment, the server verifies it.** `agentMatchSchema` gains
   `kind: "lesson" | "video"` and a required integer `startSeconds` (ignored when
   `kind === "lesson"`). Required rather than optional: Gemini's structured tool calls are
   markedly more reliable with a fixed field set than with nullable optionals.
2. **A timestamp is only real if the data contains it.** Hydration loads the `video`
   document whose `url` equals the lesson's `videoUrl` and snaps the reported second to the
   nearest `chapters[].startSeconds` (preferred) or `chunks[].startSeconds` within **±2s**.
   A chapter hit gives the card its title (the clean human label, §7); a chunk hit falls
   back to the lesson title. **No match → the result is downgraded to a LESSON card**, never
   dropped and never shown with an invented second. This makes "never invent a timestamp"
   structural.
3. **The thumbnail is the lesson's `poster`.** It is the only stored image for the moment;
   the `video` document holds no artwork. No poster → the existing dark tile with the
   lesson's initial, same as `LessonPlayer`.
4. **The timecode badge on the thumbnail is the matched second**, matching the design where
   the badge and the "Watch from …" action read the same value in all four VIDEO rows.
5. **Deduplication**: one card per `(kind, lessonId, startSeconds)`. A lesson may legitimately
   appear as both a VIDEO moment and a LESSON card (the design shows the same course twice);
   a downgraded video match that collides with an existing lesson card is dropped.
6. **At most 2 moments per lesson** are kept, so one well-chaptered video cannot flood the
   list — the ranked list should span courses, as the design's "across 8 courses" implies.
7. **Sort** keeps its three options and sorts VIDEO cards by the lesson's duration, since
   that is the only duration in the data. Relevance stays the agent's order.
8. **Progress marks are out of scope.** The design's check circle on the LESSON tile belongs
   to the progress record, which has no backend yet (AGENTS.md §7). Nothing here fakes it.
9. **The Context document is unchanged** — it already carries the video rules — so the
   critical rules land in the inline prompt only where they are new (the `return_results`
   contract, which is prompt-side by definition).

## Files to touch

| File | Change |
| --- | --- |
| `sanity/lib/queries.ts` | Add `videoUrl` + `poster` to `SEARCH_LESSONS_BY_IDS_QUERY`; add `SEARCH_VIDEO_MOMENTS_QUERY` (`chapters[]{startSeconds,label}` and `"chunkSeconds": chunks[].startSeconds` — seconds only, never chunk text). |
| `sanity.types.ts` | TypeGen output only (`npm run typegen` in `studio/`). Never hand-edited. |
| `app/lib/search/schema.ts` | `kind` + `startSeconds` on `agentMatchSchema`; new `VideoSearchResult`; `SearchResult` becomes a discriminated union; `matchedOn` gains `chapter` / `transcript`. |
| `app/lib/search/hydrate.ts` | Verify + snap moments, build both card kinds, dedupe, cap 2 moments/lesson; `countCourses` takes the union. |
| `app/lib/search/prompt.ts` | New "Video moments" section: two-stage resolution, filter-inside-array + slice, copy `startSeconds` verbatim, never surface a `video` document as a result. |
| `app/components/search/VideoResultCard.tsx` | **New.** The VIDEO card. |
| `app/components/search/SearchResults.tsx` | Render by `result.kind`; keys include the second; skeleton unchanged. |
| `app/components/search/LessonResultCard.tsx` | Narrow its prop type to `LessonSearchResult` (no visual change). |

## Requirements

- **Layout (VIDEO card)**: 276px thumbnail on the left (full width when stacked), rounded,
  `aspect-video`, poster image, a centred circular white play glyph, and the matched
  timecode in a dark pill at the bottom-right. Right column: course cover + course title,
  a `Badge variant="video"` reading **VIDEO** on the right, the moment title, a two-line
  description (the lesson summary), and a footer row with `Lesson 5.1 · Module title` on the
  left and `Watch from 12:45 ›` in primary on the right. Reuse `Badge`, `CourseCover`,
  `AnalyticsLink`, `formatTimestamp` — add no new primitives.
- **Responsive**: below `sm` the card stacks (thumbnail full width, body underneath), the
  footer wraps, and the desktop rendering is unchanged. The existing cards' breakpoints are
  the reference.
- **The action** links to `/lessons/{slug}?t={startSeconds}` and fires
  `search_result_clicked` with `{ query, rank, lessonSlug, resultKind: "video", startSeconds }`.
- **Counts**: the heading's "Found N results across M courses" and the count row already
  read from the stream; they must now count both kinds.
- **Grounding**: no card field is ever composed from model text. The `reply` sentence stays
  the model's only prose and is not rendered as a result.
- Accessibility: the thumbnail is a link, not a button; the play glyph is `aria-hidden`; the
  accessible name says "Watch {title} from {timecode}".

## Security considerations

- No boundary moves. `hydrate.ts` keeps `import "server-only"`; the new query runs through
  `sanityFetch` with the server-side read token; the browser still only receives hydrated,
  plain result objects (AGENTS.md §5, §12).
- `startSeconds` from the model is untrusted: it is clamped to a value present in the video
  document before it reaches a URL, and the lesson page clamps `?t=` again through
  `parseStartSeconds`.
- The new query projects chunk **start seconds only** — no transcript text leaves Sanity,
  and nothing from a chunk is ever sent back to the model (§12).
- No new env var, no new external call.

## Acceptance criteria

1. Searching "data fetching" returns a merged, ranked list containing both VIDEO and LESSON
   cards; the count row and heading agree with the number of cards rendered.
2. Every VIDEO card's timecode equals a `startSeconds` present in that lesson's `video`
   document; clicking "Watch from …" opens the lesson with the embed starting at that second.
3. A moment the agent reports that is not in the data renders as a LESSON card, never as a
   VIDEO card with a made-up second.
4. No `video` document appears as a result on its own.
5. The desktop rendering matches `design/vertex-search.png`; the page is usable at 375px.
6. An empty query, a zero-result query, and an error each still render as they do today.

## Checks to run

- `studio/`: `npm run typegen` (regenerates `sanity.types.ts` for the new query).
- Web: `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- `npm run dev` and a live search against the real MCP endpoint (AGENTS.md §13).

## Manual test steps

1. `npm run dev`, open `http://localhost:3000/search?q=data%20fetching`.
2. Confirm skeletons, then a mixed list; note the first VIDEO card's timecode.
3. In Vision (or the query used above) run
   `*[_type=="lesson" && slug.current=="<that lesson>"]{videoUrl}` then
   `*[_type=="video" && url==$url]{chapters[].startSeconds, chunks[].startSeconds}` and
   confirm the timecode is in the list.
4. Click "Watch from …" — the lesson page opens and the player starts at that second.
5. Search a term with no matches (e.g. "quantum knitting") — the empty-state panel shows and
   points at the catalog.
6. Resize to 375px and confirm both card kinds stack without horizontal scroll.
