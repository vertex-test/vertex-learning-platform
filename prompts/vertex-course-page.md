# Implement the course page

## Goal

Build the course detail page at `app/courses/[slug]/page.tsx` to match `design/vertex-course.png` exactly on desktop, adapting sensibly down to mobile, wired to the seeded Sanity content through the existing read layer.

Sections, top to bottom: breadcrumbs, a hero (cover tile, POPULAR badge, title, summary, meta row, Continue Learning + Bookmark), a "What you'll learn" panel of outcome cards, a "Course Content" module accordion with a show-all control, and a sticky bottom progress bar.

Scope is this one route plus the components it needs. No catalog page, no lesson page, no instructor page, no search, no PostHog, no progress backend (AGENTS.md §1, "Build nothing beyond that").

## Skills / docs read

- `AGENTS.md` §2 (workflow), §3 (reference image is the source of truth, reuse existing components first), §5 (pages are read-only, server-only Sanity access), §7 (decisions already made: derived numbering, presentational-only surfaces), §8 (the content model), §12 (private dataset, token stays server-side), §13 (checks).
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md` — dynamic segments via `[slug]` folders, `generateStaticParams`.
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` — `PageProps<'/courses/[slug]'>` is a globally available generated helper; `params` is a Promise and must be awaited.
- `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md` — `images.remotePatterns` is required before `next/image` will load a remote host.
- `sanity-best-practices` — not re-read in full for this pass: the schema, queries, TypeGen and fetch helper already landed in commits `96de5d7` / `b51cde1` and this page only consumes them.

## Code inspected

- `sanity/lib/queries.ts` — `COURSE_BY_SLUG_QUERY` and `COURSE_SLUGS_QUERY` already exist and already project everything this page needs (outcomes, instructor, category, modules with dereferenced lessons, `moduleCount`, `lessonCount`, `totalDurationSeconds`). **No query changes needed.**
- `sanity.types.ts` — `COURSE_BY_SLUG_QUERY_RESULT` confirms the shape; every field is nullable because TypeGen keeps `required()` fields nullable.
- `sanity/lib/fetch.ts` — `sanityFetch({query, params, tags, revalidate})`, server-only, returns the TypeGen type.
- `sanity/lib/derive.ts` — `courseOutline()` (module/lesson numbering + duration sums), `formatDuration`, `formatCompactCount`, `formatLevel`. All already written and all used here. **No new helpers needed.**
- `sanity/lib/image.ts` — `urlFor()` image URL builder.
- `app/globals.css` — full token set; `--color-canvas`, `.page-hatch`, the type scale, radii and shadows all exist.
- `app/page.tsx` — the page shell (hatch gutters, capped 1360px column, bordered sides) and a local `HeaderActions` (bell + Clerk `Show`/`SignInButton`/`UserButton`). This is duplicated markup the course page also needs.
- `app/components/ui/` — `Nav` (takes `actions`, `activeHref`), `Breadcrumbs`, `Button`/`ButtonLink`, `Badge` (has a `popular` variant), `ProgressBar`, `Card`, `CourseCard`, `StatusIndicator`, `CourseIcon`.
- Live dataset (queried directly with the read token): 10 courses, each with 4 modules, 12 lessons, 4 outcomes, a real 1600×900 cover asset on `cdn.sanity.io`, and populated `popular` / `studentCount`.

## Reference measurements

The reference is a 1440px canvas exported at 1024px, so image pixels × 1.406 ≈ design pixels. Figures below are design pixels.

- **Shell** — identical to the home page: warm canvas, diagonal hatch gutters, ~1360px column with hairline side rules, white header bar.
- **Breadcrumbs** — ~44px below the header, `All Courses › Next.js for Production`, the existing §13 component.
- **Hero** — two columns, ~48px gap. Left: a square cover tile ~392px, 16px radius. Right: POPULAR badge, then Playfair Display title ~62px/~72px, then Inter 16/24 `neutral-700` summary at ~560px max width, then a meta row (~28px above it) of four items — level, total duration, module count, student count — each a 16px `neutral-500` lucide glyph plus 14px `neutral-700` label, ~32px apart. Then the action row (~28px above): `Continue Learning` primary button with trailing arrow, and `Bookmark` tertiary button with a leading bookmark glyph, ~24px apart. Buttons are ~62px tall — hero-sized, the existing `xl`.
- **What you'll learn** — a white panel, 1px `neutral-200`, 16px radius, ~44px padding, ~64px below the hero. Playfair heading ~28px. Inside, a 2×2 grid of outcome cards (~24px gap): each is white with a 1px `neutral-200` border, 12px radius, ~28px padding, a ~40px outlined `primary-500` icon on the left, and a 18px semibold `neutral-900` title with a 14/22 `neutral-500` description beside it.
- **Course Content** — Playfair ~28px heading on the left, `12 modules · 18h 24m` in 14px `neutral-500` on the right. Below, a white panel of module rows.
- **Module row** — ~86px tall, separated by hairline rules. A ~34px circle on the left (white fill, `neutral-200` ring, 14px `neutral-700` number) with a vertical `neutral-200` connector running between consecutive circles. Then a 15px semibold title and a 13px `neutral-500` summary. On the right, the module duration in 14px `neutral-500` and a `neutral-500` chevron. Expanding rotates the chevron and reveals the module's lessons.
- **Show all** — a centred tertiary pill button, `Show all 12 modules` plus a chevron, overlapping the panel's bottom edge.
- **Sticky bottom bar** — a white bar with a `neutral-200` top border pinned to the viewport bottom, ~92px tall: `Your Progress` (12px `neutral-500`) above `35% complete` (15px, the number semibold `neutral-900`), a ~280px progress track beside it, and a `Continue Learning` primary button on the right.

## Decisions & assumptions

- **Route is `app/courses/[slug]/page.tsx`.** The home page already links to `/courses/<slug>`. Server component throughout except the accordion.
- **Data comes from the existing `COURSE_BY_SLUG_QUERY`** via `sanityFetch`, tagged `['course', \`course:${slug}\`]` so a later webhook can revalidate. `generateStaticParams` uses `COURSE_SLUGS_QUERY`. A missing slug calls `notFound()`. `generateMetadata` sets title and description from the course.
- **Derived numbers are derived, never stored** (§8): `courseOutline(course.modules)` supplies the module/lesson numbering and the per-module and total durations. The header meta row prefers the projected `moduleCount` / `totalDurationSeconds` and falls back to the outline, so both paths agree.
- **The header is extracted**, not copied: a new `app/components/SiteHeader.tsx` holds the `Nav` + bell + Clerk actions currently inlined in `app/page.tsx`, and both pages use it. It takes `activeHref` so `Courses` highlights here. This is a refactor of existing markup, not new design.
- **Progress is presentational with a real zero state** (confirmed with the user). There is no progress document type, no server write route, and nothing seeded, so inventing "35%" would be fabricated data. The bar renders at 0% via the existing `ProgressBar`, the label reads `0% complete`, and both CTAs read `Start Learning`. The percentage is a single `progressPercent` prop threaded from the page, so wiring real progress later is a one-line change with no layout change. Flagged below.
- **Bookmark is presentational only** (confirmed with the user), same treatment §7 gives the notifications bell — rendered exactly as designed, inert, `aria-disabled`.
- **Cover tile**: the reference shows a square brand tile; the seeded covers are 16:9 photos. I'll render the real `coverImage` through `urlFor().width(784).height(784).fit('crop')` inside a square 16px-radius container, using `next/image` with the asset's `lqip` as `blurDataURL`. `next.config.ts` gains `images.remotePatterns` for `cdn.sanity.io` — required, or the image silently fails to load. If a course has no cover, fall back to a `neutral-900` tile with the course initial, matching the existing `CourseCard` fallback.
- **Outcome icons**: a new `app/components/ui/OutcomeIcon.tsx` maps the 13 curated `learningOutcome.icon` values to lucide components (`layers`→`Layers`, `database`→`Database`, `gauge`→`Gauge`, `cloud`→`Cloud`, `shield`→`Shield`, `zap`→`Zap`, `git-branch`→`GitBranch`, `terminal`→`Terminal`, `code`→`Code`, `workflow`→`Workflow`, `rocket`→`Rocket`, `puzzle`→`Puzzle`, `sparkles`→`Sparkles`), with `Sparkles` as the fallback for an unknown or null value. The schema deliberately curates these names so authors cannot break the design (§8); this is the frontend half of that contract.
- **The accordion is the only client component**: `app/components/course/CourseContent.tsx` (`'use client'`) owns the expand/collapse state and the show-all toggle. It receives fully derived, plain-serialisable data — no Sanity client, no token, nothing crosses the boundary but strings and numbers (§5).
- **Show-all threshold**: the reference shows 6 of 12 modules. The seeded courses have 4, so the control would be pointless. I'll collapse to 6 and render the button only when there are more than 6 modules — data-driven, correct at both sizes. With the current seed all 4 modules show and no button appears. Flagged below.
- **Expanded module rows list lessons** (the reference does not show an expanded state, so this is the minimum consistent with the model): lesson number label, title, duration, and a `Free preview` badge where `freePreview` is set, each linking to `/lessons/<slug>`.
- **Links to routes that do not exist yet**: `All Courses` → `/courses`, lessons and both CTAs → `/lessons/<slug>`. Both 404 until their own references land. The lesson URL shape is `/lessons/[slug]` because a lesson slug is globally unique in the seed and a lesson stores no parent course (§8) — no course segment is needed or available.
- **The sticky bar overlays content**, so the page gets bottom padding equal to the bar height to keep the show-all button reachable.
- **Responsive**: hero stacks to one column under `lg` with the cover tile capped and centred; the outcome grid goes 1-up under `md`; module rows keep the number circle but drop the summary to two lines; the sticky bar stacks the progress block above the button under `sm`. Desktop is untouched.

## Files expected to touch

- `app/courses/[slug]/page.tsx` — **new**: the page, data fetch, `generateStaticParams`, `generateMetadata`.
- `app/components/course/CourseContent.tsx` — **new**, client: the module accordion and show-all.
- `app/components/course/CourseProgressBar.tsx` — **new**: the sticky bottom bar.
- `app/components/ui/OutcomeIcon.tsx` — **new**: the curated icon-name → lucide map.
- `app/components/SiteHeader.tsx` — **new**: header extracted from `app/page.tsx`.
- `app/page.tsx` — use `SiteHeader`; local `HeaderActions` removed. No visual change.
- `next.config.ts` — add `images.remotePatterns` for `cdn.sanity.io`.
- Nothing in `sanity/` or `studio/` changes.

## Requirements

- Desktop matches `design/vertex-course.png`: layout, spacing, typography, colour, and states.
- Every value on the page comes from the seeded Sanity content or is derived from it. Nothing is hardcoded except the zero-state progress noted above.
- Module and lesson numbers, per-module durations, and the total duration are derived from array order and lesson durations, never stored.
- Reuse `Badge`, `Button`/`ButtonLink`, `Breadcrumbs`, `Card`, `ProgressBar`, `Nav` before adding anything new.
- Responsive to ~360px with no horizontal scroll.
- Accessible: the accordion uses real `<button>`s with `aria-expanded` and `aria-controls`, the breadcrumb marks the current page, the cover image has alt text from Sanity, and icons are `aria-hidden` with text labels beside them.
- An unknown slug renders the 404 page, not a crash.

## Security considerations

- The page is a server component. `sanityFetch` and the read token stay server-side; `app/components/course/CourseContent.tsx` is the only `'use client'` file and receives plain derived data only (AGENTS.md §5, §12).
- No token, project id, or dataset name is referenced from a client component.
- The page writes nothing. The progress bar is display-only, so no write token or server route is involved.
- Browsing stays public — no Clerk gating is added to this route (§7).
- No new environment variables.

## Acceptance criteria

1. `/courses/nextjs-app-router-in-depth` renders the real seeded course: title, summary, POPULAR badge, cover image, `Intermediate`, `1h 60m`-free total duration, `4 modules`, `18.2k students`.
2. "What you'll learn" shows the course's 4 seeded outcomes with their mapped icons.
3. "Course Content" lists all 4 seeded modules, numbered 1–4, each with its summary and its summed duration; no show-all button appears at 4 modules.
4. Expanding a module lists its 3 lessons with derived `Lesson N.M` labels, durations, and free-preview badges where set.
5. The sticky bar shows an empty track and `0% complete`; both CTAs read `Start Learning` and link to the first lesson.
6. `/courses/does-not-exist` renders the 404 page.
7. All 10 seeded courses render without a crash or a missing-field hole.
8. No horizontal scroll at 360px, 768px, or 1440px.

## Checks to run

From the web workspace (`d:\vertex`):

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build` — routes, config and server code all change, so a production build is required (§13).
- `npm run dev` and walk the manual steps below.

No Studio work in this pass, so no schema deploy, no import, and no TypeGen re-run.

## Manual test steps

1. `npm run dev`, open `http://localhost:3000/courses/nextjs-app-router-in-depth`.
2. Compare side by side with `design/vertex-course.png` at 1440px wide: hero, outcome panel, module list, sticky bar.
3. Confirm the meta row reads `Intermediate · 1h 59m · 4 modules · 18.2k students` and matches the data queried from Sanity.
4. Expand modules 1 and 3; confirm lessons appear with `Lesson 1.1`…`Lesson 3.3` labels and per-lesson durations, and that the chevron rotates.
5. Confirm the sticky bar reads `0% complete` with an empty track, and that `Start Learning` points at the first lesson of module 1.
6. Click `All Courses` and a lesson link — both 404, expected until those routes land.
7. Visit `/courses/python-for-data-work` and `/courses/practical-web-security`; confirm both render with their own covers, outcomes and modules, and that only the `popular` ones show the POPULAR badge.
8. Visit `/courses/nope`; confirm the 404 page.
9. Resize to 360px and 768px; confirm the hero stacks, the outcome grid goes 1-up, the sticky bar stacks, and nothing scrolls sideways.

## Needs the user's attention

- **Progress is a zero state, not the reference's 35%.** The bar, the label, and both CTAs are wired to a single `progressPercent` prop that is `0` until the progress feature (§7) lands. The page will look different from the reference in exactly that one respect.
- **Show-all is absent with the current seed**, because every seeded course has 4 modules and the threshold is 6. It appears automatically once a course has more.
- **`/courses` and `/lessons/<slug>` 404** until the catalog and lesson pages are built.
