# Implement the Vertex home page

## Goal

Build the Vertex home page at `app/page.tsx` to match `design/vertex-home.png` exactly on desktop, and adapt sensibly down to mobile.

The page is the marketing + entry surface: header, hero with eyebrow pill, headline, subhead, primary CTA and a search field, an "All Courses" section with three course cards, and a decorative footer band.

Scope is this one page plus the primitives it needs. No Sanity, Clerk, PostHog, search route, or catalog/course/lesson pages — those arrive with their own references (AGENTS.md §1, "Build nothing beyond that").

## Skills / docs read

- `AGENTS.md` §2 (workflow), §3 (reference image is the source of truth; reproduce desktop exactly, make it responsive; reuse existing components before adding new), §5 (pages are read-only and display stored data), §6 (stack), §7 (My Learning, the notifications bell and free preview are presentational only), §13 (checks).
- No Sanity / Clerk / PostHog / search skill applies: this page touches no content model, auth, analytics, or search path.
- Repo already uses Tailwind v4 CSS-first theming (`@theme` in `app/globals.css`, no `tailwind.config.*`), App Router, `next/font/google`.

## Code inspected

- `app/globals.css` — the full token set from the design-system pass (colours, type scale, radius, shadows). No `--color-background` warm variant yet; body is white.
- `app/layout.tsx` — Playfair Display + Inter wired as `--font-playfair-display` / `--font-inter`; body is `min-h-full flex flex-col`.
- `app/page.tsx` — still the `create-next-app` starter. This is what gets replaced.
- `app/components/ui/Nav.tsx` — logo + Courses / My Learning links, white bar, bottom border. No bell or avatar yet.
- `app/components/ui/Logo.tsx`, `Button.tsx`, `Input.tsx` (`SearchInput` with `shortcut`), `Badge.tsx`, `Card/Card.tsx`, `Card/CourseCard.tsx` — all read in full.
- `app/style-guide/page.tsx` — consumes every primitive; must keep compiling after any primitive change.

## Reference measurements

The reference renders a 1440px-wide canvas exported at 1024px, so image pixels × 1.406 ≈ design pixels. Values below are the design-pixel figures I'll build to.

- **Page shell** — warm off-white ground (sampled ≈ `#FBF8F5`), not the token white. The content column is capped (~1360px) and sits on the ground with hairline vertical rules at both edges; outside those rules the far margins carry a faint diagonal hatch. Header bar is white with a `neutral-200` bottom rule, full-bleed inside the column.
- **Header** — logo left; `Courses` and `My Learning` centre-left; bell icon and a round 44px avatar right. Height ≈ 76px.
- **Hero** — centred, ~104px top padding. Eyebrow pill: white fill, 1px `neutral-200` border, full radius, `INTELLIGENT LEARNING` in `primary-500`, 12px, bold, ~0.14em tracking, uppercase. Headline: Playfair Display bold, ~80px / ~104px line height, two lines, `neutral-900`. Subhead: Inter 16/24 `neutral-700`, two lines, max ~610px. CTA: primary button, `Explore Courses` with a trailing arrow, taller than the 44px default (~66px) and ~20px text — a hero-sized button. Search field below it: ~64px tall, full radius on the container corners per the reference's 12px radius, white fill, `neutral-200` border, leading search glyph, placeholder `Ask anything about your learning…`, and a `⌘ K` key-cap chip on the right (bordered box, not the plain text the current `SearchInput` renders). Field max width ~1045px.
- **Divider** — full-width `neutral-200` rule between hero and the courses section.
- **All Courses** — section title in Playfair (Display 2, 36/44); `View all courses →` on the right in `primary-500`, 14px. Three cards in a 3-column grid, ~24px gap.
- **Course card (home layout)** — differs from the design-system card (§12) which lays the icon to the *left* of the title. Here the brand tile (~72px, 12px radius) sits *above* the title, title is Playfair (~22px), summary is Inter 14/20 `neutral-500`, then a hairline rule and the meta row (level / duration / modules) pinned to the card bottom. Card padding ~32px, `neutral-200` border, subtle shadow.
- **Footer band** — a centred hairline rule interrupted by an outlined star and the line `New courses and lessons added every week.` (Inter 16, `neutral-700`), then a decorative row of vertical bars in `primary-400`/`primary-300` fading to transparent at the bottom, bleeding off the bottom of the page.

## Decisions & assumptions

- **Content is hardcoded placeholder data** in the page file, matching the reference verbatim (Next.js for Production, Docker Essentials, TypeScript Deep Dive). Sanity is not wired yet; when it is, this array is replaced by a GROQ fetch. I'll keep the shape close to the eventual `course` projection (§8) so the swap is mechanical.
- **Brand tiles** are hand-authored inline SVG in a new `app/components/ui/CourseIcon.tsx` (Next.js wordmark "N" on a black tile, a simplified Docker whale, "TS" on the TypeScript blue tile). No external image requests, no assets to fetch — and course icons will later come from Sanity, so the component takes the mark as a prop.
- **`CourseCard` gains a `layout` prop**: `"inline"` (default, the existing design-system §12 arrangement used by the style guide) and `"stacked"` (this page). One component, two arrangements — no forked card. It also gains an optional `icon` node so the brand tiles can replace the letter tile, and an optional `href`.
- **`Nav` gains optional `actions`** (bell + avatar) rather than hardcoding them, since the design-system §13 nav has neither. Both are presentational: the bell is a button with no menu (AGENTS.md §7), and the avatar is a neutral placeholder circle — the reference shows a photo, but there is no asset and no Clerk yet, so it becomes `<UserButton />` when Clerk lands. Flagged below.
- **Search field**: a new `HeroSearch` presentational component, not a reshape of `SearchInput` — the hero field is taller with a bordered key-cap, and I don't want to distort the §08 primitive that the style guide verifies. It renders a plain, non-submitting input for now; wiring it to the search route comes with the search work. The `⌘K` chip is decorative (no key handler yet).
- **Button height**: the hero CTA is taller than the §07 44px spec, so `Button` gains an `xl` size (h-14, larger text) rather than the page overriding classes. Existing `md`/`lg` are untouched.
- **Tokens**: add `--color-canvas: #FBF8F5` (the warm page ground) to `@theme`, so no component hardcodes it. The hatch and the footer bars are built from CSS gradients — no image assets.
- **Links**: `Explore Courses` and `View all courses` point at `/courses`; cards point at `/courses/<slug>`. Those routes don't exist yet, so they 404 until the catalog lands. That is expected and noted below.
- The page stays a **server component**. Nothing here needs client JS.

## Files expected to touch

- `app/page.tsx` — **rewritten**: the home page.
- `app/components/ui/CourseIcon.tsx` — **new**: inline brand marks.
- `app/components/ui/HeroSearch.tsx` — **new**: the hero search field.
- `app/components/ui/Nav.tsx` — optional `actions` slot; bell + avatar rendered by the page.
- `app/components/ui/Card/CourseCard.tsx` — `layout`, `icon`, `href` props (default behaviour unchanged).
- `app/components/ui/Button.tsx` — add the `xl` size.
- `app/globals.css` — add the `--color-canvas` token.
- `app/layout.tsx` — only if the body ground needs to change; otherwise untouched.

## Requirements

1. Desktop matches the reference in layout, spacing, typography, colour and border treatment.
2. Responsive: the course grid goes 3 → 2 → 1 column, the hero headline scales down, the nav links wrap or collapse, nothing overflows horizontally at 320px.
3. No new hardcoded hexes in components — every colour comes from a token.
4. All existing primitives keep their current API and appearance; `app/style-guide/` renders unchanged.
5. Semantic, accessible markup: one `h1`, real `<button>`/`<a>` elements, `aria-label` on the icon-only bell, `alt`/`aria-hidden` correct on decorative SVG, visible focus states.
6. Server component, no `"use client"`.

## Security considerations

Nothing sensitive on this page: no tokens, no data fetching, no writes, no third-party script. All content is static and server-rendered, all assets are inline SVG or CSS (no external image or font host beyond the existing `next/font` setup). The server/client boundary in AGENTS.md §5 is preserved trivially — there is no client code.

## Acceptance criteria

- `/` renders the home page; the starter template is gone.
- Side-by-side against `design/vertex-home.png` at 1440px, every section matches: header, eyebrow pill, headline, subhead, CTA, search field, divider, All Courses heading + link, three cards with brand tiles and meta rows, footer rule with star and the bar band.
- `/style-guide` is visually unchanged.
- Type check, lint and production build all pass clean.

## Checks to run

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build` (routes and shared components change)
- `npm run dev` and inspect `/` and `/style-guide`

## Manual test steps

1. `npm run dev`, open `http://localhost:3000/`.
2. At 1440px width, compare against `design/vertex-home.png`: header row, eyebrow pill, two-line Playfair headline, subhead, orange CTA with arrow, search field with the `⌘ K` chip, hairline divider, "All Courses" + "View all courses →", three course cards, footer rule with star and the fading bar band.
3. Resize to 1024px, 768px and 375px: the grid steps 3 → 2 → 1, the headline shrinks, no horizontal scrollbar at any width.
4. Tab through the page: logo, both nav links, bell, avatar, CTA, search input, "View all courses", each card — every stop shows a visible focus ring.
5. Open `/style-guide` and confirm the course card, buttons and nav look exactly as before.
6. Click `Explore Courses` and a course card and confirm they navigate to `/courses` and `/courses/<slug>` (expected 404 until the catalog exists).
