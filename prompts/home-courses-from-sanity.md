# Wire the home page's All Courses section to Sanity

## Goal

Replace the hardcoded `courses` array in `app/page.tsx` with the seeded Sanity content, so the three cards under "All Courses" show real courses with real covers, levels, durations and module counts.

Scope is that one section. The hero, the footer band, and every other page are untouched.

## Skills / docs read

- `AGENTS.md` §5 (pages are read-only and display stored data; server-only Sanity access), §7 (ground everything in real data — never invent a course, duration or count), §3 (reuse existing components before adding new).
- Nothing new from `node_modules/next/dist/docs/`: this reuses the fetch and image patterns already landed on the course page in this session.

## Code inspected

- `sanity/lib/queries.ts` — `COURSES_CATALOG_QUERY` already exists and already projects everything a card needs (`title`, `slug`, `summary`, `level`, `coverImage`, `moduleCount`, `totalDurationSeconds`), ordered popular-first then title. **No query changes needed.**
- `sanity.types.ts` — `COURSES_CATALOG_QUERY_RESULT` confirms the shape.
- `app/page.tsx` — the placeholder array at the top (Next.js for Production, Docker Essentials, TypeScript Deep Dive) and the `CourseCard` grid that consumes it.
- `app/components/ui/Card/CourseCard.tsx` — takes `icon?: ReactNode` for the 72px brand tile, plus `title`, `summary`, `level`, `duration`, `moduleCount`, `layout`, `href`. **No changes needed** — a cover image can be passed straight in as `icon`.
- `app/components/ui/CourseIcon.tsx` — the three hand-authored brand SVGs. `app/page.tsx` is its only consumer.
- `app/courses/[slug]/page.tsx` — its local `CoverTile` already renders a Sanity cover as a square `next/image` with the `lqip` blur placeholder. That logic is what the card tile needs at a smaller size.

## Decisions & assumptions

- **`app/page.tsx` becomes an async server component** and fetches `COURSES_CATALOG_QUERY` through `sanityFetch`, tagged `['course']` to match the course page. It renders the **first three** results — the query is already ordered popular-first, so the home page shows the three most prominent courses and `View all courses` leads to the full catalog later.
- **The brand tiles become real cover images.** The seeded courses carry 16:9 cover assets, not logo marks, so each card's 72px tile renders that cover cropped square. This is the honest rendering of the actual content; the design's Next.js / Docker / TypeScript logos were placeholders for courses that do not exist in the dataset.
- **`CoverTile` is extracted and shared**: a new `app/components/ui/CourseCover.tsx` renders a Sanity cover as a square, rounded `next/image` with the `lqip` blur and a `neutral-900` initial-letter fallback, taking the rendered size as a prop. The course page's local `CoverTile` is replaced by it (same output, one implementation), and the home page passes it as the card's `icon`.
- **`app/components/ui/CourseIcon.tsx` is deleted.** `app/page.tsx` is its only consumer and stops using it; leaving three unused hand-drawn brand SVGs behind is dead code. Flagged below in case you want them kept for a future icon field.
- **Empty state**: if the fetch returns nothing, the section renders a short "No courses yet." line rather than an empty grid. Grounded, and it stops a broken dataset looking like a layout bug.
- Durations and levels come from the existing `formatDuration` / `formatLevel` helpers, same as the course page — no new formatting logic.

## Files expected to touch

- `app/page.tsx` — async, fetches the catalog, renders three real cards; placeholder array removed.
- `app/components/ui/CourseCover.tsx` — **new**: the shared square cover tile.
- `app/courses/[slug]/page.tsx` — local `CoverTile` replaced by `CourseCover`.
- `app/components/ui/CourseIcon.tsx` — **deleted**.
- Nothing in `sanity/` or `studio/` changes.

## Requirements

- The three cards show real seeded courses; no hardcoded titles, summaries, levels, durations or counts remain in `app/page.tsx`.
- Cards link to `/courses/<real slug>`, so clicking one reaches the course page built in this session.
- The section's layout, spacing and typography are unchanged from `design/vertex-home.png` — only the data behind it changes.
- The home page stays a server component; no token or Sanity client reaches the browser.

## Security considerations

- `sanityFetch` and the read token stay server-side (AGENTS.md §5, §12). `app/page.tsx` gains no `'use client'`.
- `CourseCover` is presentational and takes only a plain asset id, alt string and lqip — safe in either a server or client tree.
- No writes, no new environment variables.

## Acceptance criteria

1. `/` shows three real courses from the dataset, popular-first, with their own covers, summaries, levels, durations and module counts.
2. Each card links to its real course page and that page loads.
3. No placeholder course data remains anywhere in `app/page.tsx`.
4. The course page renders identically after swapping to the shared `CourseCover`.
5. `tsc`, `lint` and `build` all pass.

## Checks to run

From `d:\vertex`: `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm run dev` for the manual steps.

## Manual test steps

1. `npm run dev`, open `http://localhost:3000/`.
2. Confirm the three cards are real courses (popular-first: Building AI Apps with LLMs, Next.js App Router in Depth, Python for Data Work) with cover images and correct meta.
3. Click each card; confirm it reaches its course page.
4. Confirm the course page hero cover still renders with its blur placeholder.
5. Compare the section against `design/vertex-home.png` — layout unchanged.

## Needs the user's attention

- **Card tiles now show cover photos, not brand logos.** The dataset has no per-course icon field. If you want the logo look back, that needs an icon or logo field on `course` — say the word and I'll spec it.
- **`CourseIcon.tsx` is deleted** as dead code. Tell me to keep it if you'd rather.
