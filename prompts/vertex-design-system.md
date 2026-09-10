# Implement Vertex Design System (revision pass)

## Goal

Bring the Vertex design system — tokens plus reusable UI primitives — to an exact match with `design/vertex-designsystem.png`.

A first pass already landed the scaffolding (tokens in `app/globals.css`, fonts in `app/layout.tsx`, twelve primitives under `app/components/ui/`, a verification page at `app/style-guide/`). This pass keeps that structure and **corrects the places where it does not match the reference**, which I verified by cropping and colour-sampling the design image section by section.

Scope stays tokens + primitives + the style-guide verification page. No catalog/course/lesson/search pages, no Sanity, Clerk, PostHog, or search wiring — those come with their own reference images later (AGENTS.md §1, "Build nothing beyond that").

## Skills / docs read

- `AGENTS.md` §2 (workflow), §3 (UI is reproduced exactly from the reference; responsive down to mobile), §5 (web workspace boundaries), §6 (stack), §13 (checks).
- No Sanity / Clerk / PostHog / search skill applies — this touches no content model, auth, or search path.
- Next.js: confirmed App Router + Tailwind v4 CSS-first theming is what the repo already uses (no `tailwind.config.*`; theme lives in `app/globals.css`).

## Code inspected

- `package.json` — Next 16.3.4, React 19.2.8, Tailwind v4, `lucide-react` 1.44 already installed.
- `app/globals.css` — tokens present, but colours are declared twice (`:root` literals plus a self-referential `@theme inline` block, e.g. `--color-primary-500: var(--color-primary-500)`). It resolves today but is circular and fragile.
- `app/layout.tsx` — Playfair Display + Inter already wired via `next/font/google`. Correct, no change needed.
- All twelve components under `app/components/ui/` and `app/style-guide/page.tsx` — read in full; deltas listed below.
- `app/page.tsx` — still the `create-next-app` starter. Out of scope, untouched.

## Design deltas found (crops + pixel sampling of the reference)

1. **Logo** — reference is an orange downward-pointing triangle with an inverted triangle cut out of its upper centre and a vertical slit splitting the top edge, next to a **sans-serif (Inter) bold** "Vertex" wordmark. Current code renders a rounded orange square containing the letter "V" with a **Playfair** wordmark. Both wrong.
2. **Badges (§09)** — reference: `VIDEO` = primary-100 background / primary-500 text; `LESSON` = light indigo background / indigo text; `POPULAR` = primary-100 background / primary-500 text. Current code has video on a dark navy chip, lesson in orange, popular in solid orange. All three wrong.
3. **Status indicators (§10)** — reference: In Progress = orange arc, Completed = **green** ring + check, Now Playing = solid orange play circle, Locked = dark neutral lock. Current: in-progress is grey, completed is orange. Needs a success-green token (not in the sheet's palette; sampled ≈ `#22C55E`).
4. **Button hover/disabled (§07)** — reference primary hover is a **darker** orange; current uses primary-400 (lighter). Reference disabled primary is a pale peach fill with pale orange text; current uses primary-200 with translucent white text. Secondary/tertiary hover in the reference is a lift (shadow), not a grey fill.
5. **Button icon placement** — tertiary/text buttons put the icon **after** the label ("View Lesson ↗", "Watch Video ▶"), but the video lesson card puts it **before** ("▶ Watch from 12:45"). The component only supports trailing icons.
6. **CourseCard layout (§12)** — reference lays the dark tile icon on the **left** with title and summary stacked to its right; current stacks the icon above the title.
7. **ResourceCard layout (§12)** — same: file icon left, title and description to its right; footer is `PDF · 1.2 MB` on the left and an **orange** external-link icon on the right. Current stacks and uses a neutral icon.
8. **LessonCard footers (§12)** — video variant's right action is orange with a **leading filled play circle**; lesson variant's right action is orange with a trailing external-link icon. Current renders a neutral text button with the icon on the wrong side, and duplicates the timestamp on both sides of the footer.
9. **ProgressBar (§11)** — reference label is `35%` in neutral-900 semibold followed by `complete` in neutral-500; current renders the whole label in neutral-500.
10. **Style-guide page** — collapses sections 02/03 and 09/10/11, and omits the reference's spec lists (icon specs, button specs, field specs) and the §14 principles row. It should mirror the sheet's numbered sections one-for-one so it can be diffed against the image.
11. **Responsiveness** — cards are pinned at `max-w-sm` and several sections use non-wrapping flex rows that overflow on narrow viewports.
12. **Lint hygiene** — the vendored `.agents/skills/**` reference code is being linted and emits a warning. Add it to the ESLint ignore list so `npm run lint` reports only our code.

## Decisions & assumptions

- **Tokens**: collapse the duplicated `:root` + `@theme inline` colour declarations into a single `@theme` block with literal values (the Tailwind v4 idiom). Keep every hex exactly as labelled in §01. Keep the existing radius, shadow, and type-scale tokens — those already match the sheet.
- **Tokens not on the sheet** — three values the reference uses visually but never labels. I'll add them as explicitly-named tokens with a comment saying they are derived, rather than hardcoding hexes in components:
  - `--color-primary-600: #EA580C` — primary button hover only.
  - `--color-accent-lesson` / `--color-accent-lesson-bg` (`#4F46E5` / `#EEF0FB`) — the LESSON badge.
  - `--color-success: #22C55E` — the Completed status ring.
- **Spacing**: Tailwind v4's default 4px scale already yields every value in §04 (4/8/12/16/24/32/40/48/64). No custom spacing tokens.
- **Logo** is a hand-authored inline SVG (two mirrored arm paths in a 32×32 viewBox, solid primary-500) in a new `app/components/ui/Logo.tsx`, so nav and future pages share one mark.
- **Style guide stays** at `app/style-guide/`. It is the only way to visually diff against the reference and it costs nothing at runtime (static, unlinked). Flagging again that it is not one of AGENTS.md §1's pages — say the word and I'll delete it after you've verified.
- Components stay presentational and server-renderable; only `Pagination` keeps `"use client"` (it takes a callback).

## Files expected to touch

- `app/globals.css` — de-duplicate token declarations; add the three derived tokens.
- `app/components/ui/Logo.tsx` — **new**, SVG mark + wordmark.
- `app/components/ui/Nav.tsx` — use `Logo`.
- `app/components/ui/Button.tsx` — hover/disabled colours, `iconPosition`.
- `app/components/ui/Badge.tsx` — correct all three variants.
- `app/components/ui/StatusIndicator.tsx` — correct icons and colours.
- `app/components/ui/ProgressBar.tsx` — split label emphasis.
- `app/components/ui/Card/CourseCard.tsx`, `LessonCard.tsx`, `ResourceCard.tsx` — layout corrections.
- `app/components/ui/Input.tsx`, `Select.tsx`, `Breadcrumbs.tsx`, `Pagination.tsx` — minor spec/responsive touch-ups only.
- `app/style-guide/page.tsx` — one section per sheet section (01–14), incl. spec lists and principles.
- `eslint.config.mjs` — ignore `.agents/**`.

`app/layout.tsx`, `app/page.tsx`, and `package.json` are **not** changed — fonts and dependencies are already correct.

## Requirements

- Every labelled hex, type size/line-height/weight, spacing step, radius, and shadow matches §01–§05 exactly.
- Button specs literal: 44px height, 12px radius, 0/16px (lg) and 0/12px (md) padding, Inter Medium 14–16px, with default/hover/disabled for all four variants.
- Field specs literal: 44px height, 12px radius, 1px `#E2E8F0` border, 0/16px padding, focus border `#FB923C`.
- Icons are lucide at 24×24 with 2px stroke and round caps; filled variants use `fill`.
- No hardcoded hex or px in components where a token exists.
- Every section of the style guide is readable and non-overflowing from 360px up.
- No data fetching, no secrets, no server/client boundary crossings.

## Security considerations

None. Purely presentational components; no network calls, no env vars, no tokens, no user input beyond uncontrolled form fields that are never submitted.

## Acceptance criteria

- `/style-guide` visually matches each numbered section of `design/vertex-designsystem.png`, including button hover and disabled states, input focus, and all four card types.
- Every primitive is typed, exported, and reusable by future page work without modification.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass clean.

## Checks to run

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build` (globals, a route, and server components all change)
- `npm run dev` + the manual pass below

## Manual test steps

1. `npm run dev`, open `http://localhost:3000/style-guide`.
2. §01 — compare each swatch and hex label against the sheet.
3. §02/03 — Playfair for Display 1/2, Inter elsewhere; check each row's size/weight.
4. §04/05 — spacing squares, six radii, four shadows.
5. §06 — outline and filled icon rows plus the icon spec list.
6. §07 — hover each button; inspect the disabled row. Primary hover must go **darker**, not lighter.
7. §08 — focus the search input (border turns `#FB923C`); open the select.
8. §09/10/11 — VIDEO peach, LESSON indigo, POPULAR peach; Completed ring is green; progress bar is 35% with `35%` bolded.
9. §12 — all four cards: icon-left layouts on course/resource, badges and orange footer actions on both lesson cards.
10. §13 — logo mark matches the triangle, breadcrumbs, pagination.
11. Resize to ~375px — nothing overflows horizontally.
12. Confirm `npm run build` is clean.
