# Implement the All Courses page

## Goal

Build the catalog at `app/courses/page.tsx`: every seeded course, in the same card grid the home page uses.

This is the destination for `Explore Courses`, `View all courses`, the `Courses` nav link, and the course page's `All Courses` breadcrumb — all four already point at `/courses` and currently 404.

Explicitly kept simple, per the request: no filters, no sort control, no pagination, no search box. Those are separate features with their own references.

## Skills / docs read

- `AGENTS.md` §3 (there is **no** reference image for this page — `design/` has home, course, lesson, search and the design system, but no catalog; §3 says the file stays silent on visuals on purpose, so this page borrows its visual language wholesale from `design/vertex-home.png` rather than inventing one), §5 (read-only server page), §7 (ground every value in real data), §14 (keep it small).
- Nothing new from `node_modules/next/dist/docs/`: this is a plain static segment, the simplest case of the routing doc already read this session.

## Code inspected

- `sanity/lib/queries.ts` — `COURSES_CATALOG_QUERY` returns every course ordered popular-first then title, with everything a card needs. **No query changes needed.**
- `app/page.tsx` — the "All Courses" section: heading, grid, and the `CourseCard` + `CourseCover` wiring. This page reuses that mapping verbatim, just without the three-card slice.
- `app/components/ui/Card/CourseCard.tsx`, `app/components/ui/CourseCover.tsx`, `app/components/SiteHeader.tsx` — all reused as-is.
- `app/components/ui/Pagination.tsx`, `Select.tsx` — exist, deliberately **not** used here.

## Decisions & assumptions

- **Route is `app/courses/page.tsx`**, a static segment sitting beside the existing `app/courses/[slug]/`. Server component, no client JS.
- **Shell matches the home and course pages**: hatch gutters, capped 1360px column, `SiteHeader` with `activeHref="/courses"` so `Courses` highlights.
- **Header block**: a Playfair `All Courses` display heading with a one-line subhead giving the real count (`10 courses`) — derived from the result, not written down.
- **The card mapping is extracted, not copied.** `app/components/ui/Card/CourseCard.tsx` gains a sibling `CatalogGrid` component (`app/components/course/CatalogGrid.tsx`) that takes the `COURSES_CATALOG_QUERY_RESULT` rows and renders the grid — cover tile, title, summary, level, duration, module count, href. The home page's section switches to it with its three-item slice. One mapping, two callers; drifting card markup between the two pages is the thing worth preventing.
- **All courses are shown**, all 10. With a catalog this size pagination would be noise; the grid is the whole answer.
- **Empty state**: the same "No courses yet." line the home page uses, lifted into `CatalogGrid` so both pages share it.
- No breadcrumbs — this is a top-level page, and the nav already marks it.

## Files expected to touch

- `app/courses/page.tsx` — **new**: the catalog.
- `app/components/course/CatalogGrid.tsx` — **new**: the shared card grid and empty state.
- `app/page.tsx` — its "All Courses" grid switches to `CatalogGrid`. No visual change.
- Nothing in `sanity/` or `studio/` changes.

## Requirements

- Every course on the page comes from Sanity; nothing is hardcoded.
- Cards link to `/courses/<slug>` and those pages load.
- The grid matches the home page's cards exactly — same component, same spacing, 3-up on desktop, 2-up at `sm`, 1-up below.
- `/courses` resolves ahead of `/courses/[slug]`, and the course pages keep working.
- Server component; no token or Sanity client reaches the browser.

## Security considerations

- `sanityFetch` and the read token stay server-side (AGENTS.md §5, §12). No `'use client'` in this pass.
- `CatalogGrid` is presentational and takes plain query rows.
- No writes, no new environment variables.

## Acceptance criteria

1. `/courses` returns 200 and lists all 10 seeded courses, popular-first.
2. The subhead shows the real count.
3. Every card links to a course page that loads.
4. The home page's three-card section is unchanged.
5. `tsc`, `lint` and `build` all pass.

## Checks to run

From `d:\vertex`: `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run dev`.

## Manual test steps

1. `npm run dev`, open `http://localhost:3000/courses`.
2. Count 10 cards; confirm the popular ones lead.
3. Click three cards at random; each course page loads.
4. Open `/` and confirm the three-card section looks the same as before.
5. From a course page, click the `All Courses` breadcrumb — it now resolves.
6. Resize to 360px and 768px.

## Needs the user's attention

- **No design reference exists for this page.** It borrows the home page's card grid and type treatment. If you have a catalog mockup, send it and I'll match it instead.
- **Filters, sort and pagination are deliberately absent.** Say the word when you want them.
