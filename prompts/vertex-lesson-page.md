# Implementation prompt — Lesson page

## Goal

Build the lesson page at `/lessons/[slug]` from `design/vertex-lesson.png`, wired to the
seeded Sanity content, with the lesson's video playing on the page itself.

## Skills and docs read

- `AGENTS.md` (§3 UI, §5 structure, §7 decisions, §8 data model, §9 video, §12 gotchas, §13 checks).
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` —
  confirms `params` and `searchParams` are Promises in this version, that `PageProps<"/route">`
  is a global helper, and that **reading `searchParams` on the server opts the page into
  dynamic rendering**. This drives the decision below about `?t=`.
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`,
  `06-fetching-data.md` — server/client boundary conventions.

## Code inspected

- `sanity/lib/queries.ts` — `LESSON_BY_SLUG_QUERY`, `LESSON_COURSE_CONTEXT_QUERY` and
  `LESSON_SLUGS_QUERY` **already exist** and return everything this page needs. No query changes.
- `sanity/lib/derive.ts` — `courseOutline`, `findLesson`, `formatDuration`, `formatTimestamp`,
  `formatCount`, `formatLevel` already exist. `findLesson` already returns `previous`/`next`
  continuous across module boundaries.
- `sanity/lib/fetch.ts` — the server-only read path with tag-based revalidation.
- `app/courses/[slug]/page.tsx` — the page shell pattern to match: `page-hatch` +
  `max-w-[1360px]` column, `SiteHeader`, `Breadcrumbs`, sticky bottom bar.
- `app/components/course/CourseContent.tsx` — the accordion + numbered-marker + connector-line
  pattern the lesson sidebar reuses.
- `app/components/ui/` — `Badge`, `Breadcrumbs`, `Button`/`ButtonLink`, `Card`, `CourseCover`,
  `ProgressBar`, `StatusIndicator`, `PlayCircleFilled`, `AnalyticsLink`.
- `app/globals.css` — design tokens. No new tokens needed.
- `studio/schemaTypes/documents/lesson.ts` — fields are `videoUrl`, `poster`, `durationSeconds`,
  `notes` (Portable Text), `keyPoints`, `proTip`, `resources[]`, `freePreview`, `studentCount`.
- `studio/scripts/seed/.out/import.ndjson` — the **transformed** seed matches the schema
  (`poster`/`durationSeconds`), and **all 120 seeded lessons are YouTube `watch?v=` URLs**.
  Every lesson has `summary`, `keyPoints`, `proTip`, `notes` and at least one resource.

## Decisions and assumptions

1. **Video playback is a poster facade over the provider's own embed.** The page renders the
   Sanity `poster` image with a play button; clicking swaps in the provider `<iframe>` with
   `autoplay`. After that the provider's player owns all controls. This is *not* a custom
   player (AGENTS §7) — it keeps the provider chrome, avoids loading YouTube's ~1MB player on
   every lesson view, and gives a clean place to fire the `lesson_video_played` PostHog event.
   The design's player chrome is the provider's own and is reproduced by the real embed.
2. **`?t=` start seconds is read client-side via `useSearchParams()`, not server-side.**
   Reading `searchParams` in the page would make all 120 lesson pages dynamic. The player is
   already a client component, so it reads `?t=` itself inside a `<Suspense>` boundary and the
   page stays statically generated. The value is clamped to `0..durationSeconds` and passed to
   the provider's own start parameter.
3. **Provider embed mapping** lives in a new pure module `sanity/lib/video.ts` (no
   `server-only` — the client player needs it). Supports the three providers the schema
   validates (AGENTS §9):
   - YouTube (`watch?v=`, `youtu.be/`, `/embed/`) → `https://www.youtube-nocookie.com/embed/{id}?start={t}&autoplay=1&rel=0`
   - Vimeo (`vimeo.com/{id}`) → `https://player.vimeo.com/video/{id}?autoplay=1#t={t}s`
   - Bunny (`{iframe.}mediadelivery.net/play|embed/{lib}/{guid}`) → `https://iframe.mediadelivery.net/embed/{lib}/{guid}?autoplay=true&t={t}`
   An unrecognised URL returns `null` and the player renders the poster with a disabled state
   rather than an empty frame. No fabricated fallback.
4. **Portable Text notes** render through `@portabletext/react` with explicit serializers
   matching the design tokens. **I am not adding `@tailwindcss/typography`** — the design's
   Overview prose is plain and explicit serializers reproduce it exactly, where `prose` would
   need overriding in every direction. `@portabletext/react@6.2.0` is already in
   `node_modules` transitively; it gets added to `package.json` `dependencies` because we now
   import it directly.
5. **Sidebar structure mirrors the design exactly**: top-level rows are *modules* (numbered
   1..12, with a summed duration), the current module is expanded and lists its *lessons*.
   Header reads `Module {n} of {total}`. This matches the mockup, where module 5's nested
   durations sum to module 5's own `1h 28m`.
6. **Footer prev/next navigates lessons, not modules.** The mockup's footer shows module
   names, but its labels read "Previous Lesson" / "Next Lesson" and `findLesson` already
   returns true lesson neighbours. Lesson-level is the coherent reading; flagged for the user.
7. **Progress is not invented.** AGENTS §7 has progress keyed off the Clerk user id behind a
   server write route, which does not exist yet. So, exactly as `app/courses/[slug]/page.tsx`
   already does, the sidebar shows `0% complete`, no lesson gets a completed check, and the
   current lesson gets the real "Now playing" state. No fabricated percentages or check marks.
8. **The bookmark button and the Notes tab stay presentational** (AGENTS §7). The Notes tab
   renders an empty state; the Lesson Content tab holds the real content.
9. **Instructor is fetched but not rendered.** AGENTS §7 asks to surface the instructor on the
   lesson, but the design shows no instructor anywhere on this page, and §3 makes the design
   the source of truth. Flagged for the user.

## Files to touch

New:

- `app/lessons/[slug]/page.tsx` — server page: fetch, derive, compose.
- `app/components/lesson/LessonSidebar.tsx` — client: module accordion, current-lesson state.
- `app/components/lesson/LessonPlayer.tsx` — client: poster facade → provider iframe, `?t=`.
- `app/components/lesson/LessonTabs.tsx` — client: Lesson Content / Notes tabs.
- `app/components/lesson/LessonFooterNav.tsx` — client: sticky prev/next bar.
- `app/components/lesson/LessonResources.tsx` — server: the resource card row with type icons.
- `app/components/PortableTextBody.tsx` — shared Portable Text serializers.
- `sanity/lib/video.ts` — pure provider URL → embed URL mapping.

Changed:

- `package.json` — add `@portabletext/react` to `dependencies`.
- `next.config.ts` — allow `i.ytimg.com` only if a lesson poster is missing and we fall back to
  the provider thumbnail. **Assumption: not needed**, because every seeded lesson has a Sanity
  `poster` asset. Leave the config alone unless a seeded lesson turns out to lack one.

No changes to `sanity/lib/queries.ts`, `sanity.types.ts`, or any Studio schema.

## Requirements (from the design)

Page shell: `page-hatch` ground, `max-w-[1360px]` bordered column, `SiteHeader`
(`activeHref="/courses"`).

**Left sidebar** (fixed ~310px on desktop, own scroll, collapses above the content on mobile):

- "← Back to course" link in `primary-500` to `/courses/{courseSlug}`.
- Course tile (`CourseCover`, 56px) + course title + `0% complete` with a thin `ProgressBar`.
- `Module {n} of {total}` header row with a chevron.
- One row per module: numbered circle marker with the vertical connector line (reuse the
  `CourseContent` treatment), module title, summed duration, chevron. The current lesson's
  module starts expanded.
- Expanded module lists its lessons: a small dot marker, lesson title, duration. The current
  lesson is highlighted — filled dot, `Now playing` in `primary-500`, and a filled play circle
  on the right (`PlayCircleFilled`). Other lessons link to `/lessons/{slug}`.

**Main column**:

- Breadcrumbs: `All Courses` → course title → module title → lesson title.
- `LESSON {m}.{l}` badge (`Badge variant="video"`, i.e. the primary chip) — derived, never stored.
- `h1` in `font-display`, then the lesson `summary`.
- Meta row: duration (clock), course level (bar chart), student count (users) — the same `Meta`
  treatment as the course page.
- Bookmark icon button, top right, `tertiary` square, presentational.
- Player: 16:9, `rounded-lg`, `bg-neutral-900`, poster + centered play affordance → iframe.
- Tabs: `Lesson Content` (active, orange underline) and `Notes`.
- Lesson Content:
  - `Overview` heading + the `notes` Portable Text.
  - `In this lesson you will:` + `keyPoints` as a list with `CircleCheck` markers in `primary-500`.
  - `proTip` in a `primary-100` panel with a lightbulb icon and a `Pro Tip` heading.
  - `Resources` — a 3-up grid of cards: type icon, title, description, external-link icon,
    each an `<a target="_blank" rel="noopener noreferrer">`.
  - Each block renders only when its field has content.
- Sticky footer: `← Previous Lesson` tertiary button + previous lesson title/duration on the
  left, next lesson title/duration + `Next Lesson →` primary button on the right. Ends are
  omitted when there is no neighbour.

**Responsive** (AGENTS §3): below `lg`, the sidebar collapses to a `<details>`-style outline
above the main content; the meta row wraps; resources go 1-up then 2-up; the footer stacks.
Desktop stays pixel-exact.

## Security considerations

- The page is a server component; the Sanity client and `SANITY_API_READ_TOKEN` never cross
  into a client component. Client components receive only plain derived values (AGENTS §5, §12).
- No token, no MCP call, no LLM call, and no write of any kind from this page.
- Every `iframe` gets a restrictive `allow` list (`accelerometer; clipboard-write;
  encrypted-media; gyroscope; picture-in-picture; fullscreen`) and no `allow-same-origin`
  sandbox escape; `referrerPolicy="strict-origin-when-cross-origin"`.
- Resource links are author-supplied external URLs — `rel="noopener noreferrer"`, and the
  schema already constrains them to `http`/`https`.
- `?t=` is untrusted input: parsed with `Number.parseInt`, rejected unless finite and `>= 0`,
  and clamped to the lesson duration before it reaches the embed URL.
- `youtube-nocookie.com` is used so a lesson view does not set YouTube tracking cookies.

## Acceptance criteria

1. `/lessons/{slug}` for any seeded lesson renders the full design with real Sanity content.
2. The video plays **on the page** — clicking play swaps in the provider embed and the lesson
   plays in place. The learner is never sent to YouTube.
3. `/lessons/{slug}?t=125` starts playback at 2:05.
4. Breadcrumbs, the `LESSON 5.1` badge, module numbers, sidebar durations and `Module n of N`
   are all derived from array order and lesson durations — nothing of the sort is stored.
5. Prev/next navigate to the real neighbouring lessons and are absent at the course's ends.
6. Nothing on the page is fabricated: no invented progress percentage, completion check,
   duration, or student count.
7. Notes render as Portable Text (headings, lists, links, marks), not markdown.
8. `generateStaticParams` still prerenders the lesson routes — the page does not go dynamic.
9. The page is usable from 375px up with no horizontal scroll.

## PostHog events (AGENTS §7)

- `lesson_viewed` on mount — `lesson_slug`, `lesson_label`, `course_slug`, `module_number`.
- `lesson_video_played` on the play click — plus `start_seconds`.
- `lesson_tab_selected`, `lesson_module_toggled`, `lesson_navigated` (`direction: previous|next`).

Watch-depth and lesson-completed events need real player telemetry and the progress write route,
so they are **out of scope here** and called out below rather than faked.

## Checks to run

From the repo root (the web workspace):

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build` — routes and server modules change, so a production build is required (§13).
4. `npm run dev` and walk the manual steps below.

Studio needs no deploy: no schema or query changed.

## Manual test steps

1. `npm run dev`, open `http://localhost:3000/courses`, open any course, click a lesson.
2. Confirm against `design/vertex-lesson.png`: sidebar, badge, title, summary, meta row,
   player, tabs, Overview, key points, Pro Tip, Resources, sticky footer.
3. Click the player's play button — the video plays inline; you are not navigated away.
4. Append `?t=125` and reload, press play — playback starts at 2:05.
5. Click a different lesson in the sidebar — it navigates and "Now playing" moves.
6. Click `Next Lesson`, then `Previous Lesson` — you land back on the original lesson.
7. Open the first lesson of the first module: no `Previous Lesson`. Open the last lesson of the
   last module: no `Next Lesson`.
8. Switch to the `Notes` tab — it shows the empty state, not lesson content.
9. Click a resource card — it opens in a new tab.
10. Narrow the viewport to 375px — the sidebar collapses above the content, nothing overflows.
11. In the browser devtools Network tab, confirm no Sanity token and no `sanity.io` query
    appears in any client-side request.
