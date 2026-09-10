# Sanity content model, standalone Studio, and the server-side data layer

## Goal

Stand up the content backbone for Vertex (AGENTS.md §5, §8):

1. A **standalone Sanity Studio workspace** at `studio/`, replacing the
   embedded Studio that `npm create sanity` scaffolded into the Next.js app.
2. The **content model** for `course`, `module` (embedded object), `lesson`,
   `instructor`, and `category`, plus the objects they need.
3. The **server-only read client, fetch helper, and GROQ query layer** in the
   web workspace, with TypeGen wiring so queries are typed.

Out of scope for this pass, by design: the `video` documents and ingestion
(AGENTS.md §9), the agent `context` document (§10), the `progress` record (§7),
and rewiring any page to real data. Pages keep their placeholder arrays; this
change only makes real data *available*.

## Skills / docs read

- `sanity-best-practices` → `references/schema.md` — `defineType` /
  `defineField` / `defineArrayMember` everywhere, icons imported from their own
  subpath (`@sanity/icons/Tag`; root named exports were removed in v5),
  data-over-presentation naming, references vs embedded objects, generated
  `_id`s only.
- `references/project-structure.md` and `references/nextjs.md` — standalone
  Studio is the recommended shape; embedded is legacy (slow builds, no Studio
  auto-updates, no TypeGen watch mode). Includes the exact migration steps used
  below.
- `references/typegen.md` — `typegen` config lives in `sanity.cli.ts`, unique
  query variable names, generated file must be inside the frontend `tsconfig`
  `include`.
- `references/groq.md` — quoted projection aliases, `order()` before slice,
  slice bounds must be literal numbers, `defineQuery` for TypeGen pickup.
- `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`
  and `08-caching.md` — **Next.js 16**: `fetch` is *not* cached by default;
  Cache Components (`use cache` / `cacheLife` / `cacheTag`) is opt-in via
  `cacheComponents: true`, which this project does not set. So caching here is
  the previous model: explicit `next: { revalidate, tags }` per request.

## Code inspected

- `sanity.config.ts`, `sanity.cli.ts`, `app/studio/[[...tool]]/page.tsx`,
  `sanity/` — all uncommitted `npm create sanity` scaffolding, embedded flavour,
  with an empty `schema.types` array.
- `sanity/lib/client.ts` — public client, `useCdn: true`, no token.
- `sanity/lib/live.ts` — `defineLive` scaffold.
- `sanity/lib/image.ts` — `urlFor` builder; only `projectId` / `dataset`, so
  client-safe.
- `app/components/ui/Card/CourseCard.tsx` — consumes `title`, `summary`,
  `level`, `duration` (formatted string), `moduleCount`, `icon`.
- `app/page.tsx:17` — placeholder catalog with a comment saying it is shaped
  like the eventual `course` projection.
- `tsconfig.json` — `include: ["**/*.ts", ...]`, `exclude: ["node_modules"]`.
- `.env.local` — `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET`
  already set; **no** `SANITY_API_READ_TOKEN` yet.
- `design/vertex-course.png`, `design/vertex-lesson.png` — source of truth for
  which fields must exist (see "Field decisions").

## Decisions & assumptions

**Layout** (confirmed with the user): `studio/` becomes a standalone workspace;
the existing Next.js app at the repo root *is* the web workspace. Committed
files do not move.

**No `defineLive`.** `next-sanity`'s live/Visual Editing path needs a
`browserToken` to subscribe from the client. The dataset is private and
AGENTS.md §12 forbids a client-side token, so `sanity/lib/live.ts` is deleted
and pages fetch server-side with `next: { revalidate, tags }` instead.

**Durations are stored as seconds, not strings.** The UI shows `1h 28m` and a
course total of `18h 24m`; a course total must be the sum of its lessons, which
only works with a number. Formatting is a frontend concern.

**Numbering is derived, never stored** (AGENTS.md §8). `Module 5`, `Lesson 5.1`
come from array order. GROQ has no index projection, so the query returns the
course outline and a small helper computes labels, prev/next, and totals in TS.

**Lesson level is not stored.** The lesson page shows `Intermediate`, but that
is the course's level — derived through the reverse reference, not duplicated.

**A lesson gets a `summary`.** AGENTS.md §8 does not list it, but the lesson
design has a one-line description under the title distinct from the Portable
Text notes, and §8 leaves field choice open.

**Outcome icons are a fixed list of names**, not free text or uploads. The
course design shows four line icons (layers, database, gauge, cloud) from the
same family as the `lucide-react` set already in the project; the frontend maps
the stored name to a component.

**`useCdn: false`** on the read client. The dataset is private and reads go
through Next's cache anyway, so guaranteed freshness costs almost nothing here.

## Files to touch

### Remove (embedded-Studio scaffolding)

- `app/studio/[[...tool]]/page.tsx` (and the now-empty `app/studio/`)
- `sanity.config.ts`, `sanity.cli.ts` (root)
- `sanity/schemaTypes/index.ts`, `sanity/structure.ts`, `sanity/lib/live.ts`
- Root `package.json`: drop `sanity`, `@sanity/vision`, `styled-components`
  (Studio-only deps); add `server-only`. Keep `next-sanity` and
  `@sanity/image-url` — the app still needs both.

### Create — `studio/` workspace

- `studio/package.json` — `sanity`, `@sanity/vision`, `@sanity/icons`, `react`,
  `react-dom`, `styled-components`, `typescript`. Scripts: `dev`, `build`,
  `deploy`, `deploy-graphql`, `typegen`.
- `studio/sanity.config.ts` — `defineConfig` with `projectId` / `dataset` from
  env, `structureTool({structure})`, `visionTool`. No `basePath`.
- `studio/sanity.cli.ts` — CLI config plus:
  ```ts
  typegen: {
    enabled: true,
    path: '../{app,sanity}/**/*.{ts,tsx}',
    generates: '../sanity.types.ts',
  }
  ```
- `studio/structure.ts` — Content list grouped as Courses / Lessons /
  Instructors / Categories.
- `studio/tsconfig.json`, `studio/.env.example`, `studio/README.md` (two lines:
  how to run, how to deploy).
- `studio/schemaTypes/index.ts` — exports the `schemaTypes` array.
- `studio/schemaTypes/documents/course.ts`, `lesson.ts`, `instructor.ts`,
  `category.ts`
- `studio/schemaTypes/objects/course-module.ts`, `learning-outcome.ts`,
  `lesson-resource.ts`, `block-content.ts`

### Create / update — web data layer

- `sanity/env.ts` — keep `projectId` / `dataset` / `apiVersion`; pin
  `apiVersion` default to a fixed date string.
- `sanity/lib/token.ts` — **new**, `import 'server-only'`, reads
  `SANITY_API_READ_TOKEN`, throws if missing.
- `sanity/lib/client.ts` — **rewrite**, `import 'server-only'`, token attached,
  `useCdn: false`, `perspective: 'published'`.
- `sanity/lib/fetch.ts` — **new**, `import 'server-only'`, `sanityFetch({ query,
  params, tags, revalidate })` wrapper over `client.fetch` passing
  `next: { revalidate, tags }`.
- `sanity/lib/queries.ts` — **new**, all `defineQuery` exports (below).
- `sanity/lib/derive.ts` — **new**, pure helpers: `formatDuration(seconds)`,
  `formatStudentCount(n)`, `courseOutline(course)` returning modules and
  lessons with derived `moduleNumber`, `lessonLabel`, per-module and total
  duration, and prev/next for a given lesson slug.
- `sanity/lib/image.ts` — unchanged.
- `sanity.types.ts` — generated, committed.
- `tsconfig.json` — add `"studio"` to `exclude` so `next build` never
  type-checks Studio sources; add `sanity.types.ts` is already covered by
  `**/*.ts`.
- `eslint.config.mjs` — ignore `studio/**` and `sanity.types.ts`.
- `.env.example` — add `NEXT_PUBLIC_SANITY_PROJECT_ID`,
  `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`,
  `SANITY_API_READ_TOKEN` with a server-only comment.
- `.gitignore` — ignore `studio/dist`, `studio/node_modules`, `studio/schema.json`.
- `README.md` — short "two workspaces" note and how to run each.

## Field decisions (the content model)

**`course`** (document, `BookIcon`)
| field | type | notes |
|---|---|---|
| `title` | string | required |
| `slug` | slug | required, source `title` |
| `summary` | text | required, rows 3 |
| `coverImage` | image | hotspot, required `alt` |
| `level` | string | list radio: `beginner` / `intermediate` / `advanced` |
| `price` | number | min 0, `0` means free |
| `popular` | boolean | optional display flag (AGENTS.md §8 says flag) |
| `studentCount` | number | display only, min 0 |
| `outcomes` | array of `learningOutcome` | max 6 |
| `instructor` | reference → `instructor` | required |
| `category` | reference → `category` | required |
| `modules` | array of `courseModule` | required, min 1 |

**`courseModule`** (object) — `title` (required), `summary` (text), `lessons`
(array of `reference` → `lesson`, required, `unique()`).

**`lesson`** (document, `PlayIcon`) — `title`, `slug`, `summary` (text),
`videoUrl` (url, `scheme: ['http','https']`, required), `poster` (image,
hotspot, `alt`), `durationSeconds` (number, integer, positive, required),
`freePreview` (boolean, label-only per AGENTS.md §7), `studentCount` (number),
`notes` (`blockContent`), `keyPoints` (array of string, max 6),
`proTip` (text, optional), `resources` (array of `lessonResource`).
No parent-course field — derived by reverse reference.

**`lessonResource`** (object) — `type` (list: `documentation`, `article`,
`code`, `download`, `video`), `title`, `description` (text), `url` (required).

**`learningOutcome`** (object) — `icon` (list of curated names:
`layers`, `database`, `gauge`, `cloud`, `shield`, `zap`, `git-branch`,
`terminal`), `title`, `description` (text).

**`instructor`** (document, `UserIcon`) — `name`, `slug`, `photo` (image,
hotspot, `alt`), `expertise` (array of string, `unique()`), `bio`
(`blockContent`).

**`category`** (document, `TagIcon`) — `title`, `slug`, `description` (text).

**`blockContent`** (object, Portable Text) — standard block with H2/H3, bullet
and numbered lists, strong/em/code marks, link annotation (`url`, required),
plus an inline `image` (hotspot, `alt`) and a `codeBlock`-free minimum. No
markdown anywhere (AGENTS.md §7).

Every document type gets `preview` (title + subtitle + media) and an
`orderings` entry where it helps authors.

## GROQ queries (`sanity/lib/queries.ts`)

All wrapped in `defineQuery`, unique variable names, shared fragments for the
image and the course card projection.

- `COURSES_CATALOG_QUERY` — all courses, `order(popular desc, title asc)`, with
  `moduleCount`, `lessonCount`, `totalDurationSeconds` (summed through the
  module → lesson references), instructor name, category title.
- `COURSE_SLUGS_QUERY` — slugs for `generateStaticParams`.
- `COURSE_BY_SLUG_QUERY` — the full detail page: marketing fields, outcomes,
  instructor, category, and `modules[]{ _key, title, summary, lessons[]->{
  _id, title, "slug": slug.current, durationSeconds, freePreview } }`.
- `LESSON_BY_SLUG_QUERY` — the lesson itself, incl. `notes`, `keyPoints`,
  `proTip`, `resources`, `videoUrl`, `poster`.
- `LESSON_COURSE_CONTEXT_QUERY` — the parent course via
  `*[_type == "course" && references($lessonId)][0]`, returning the outline the
  sidebar, breadcrumbs, numbering, and prev/next need.
- `INSTRUCTOR_SLUGS_QUERY`, `INSTRUCTOR_BY_SLUG_QUERY` (with the courses that
  reference them), `CATEGORIES_QUERY`.

Rules honoured: quoted aliases for `slug.current` and every computed key,
`order()` before slice, no `$params` inside slice bounds, `_key` projected on
every array member.

## Security

- `SANITY_API_READ_TOKEN` is read only in `sanity/lib/token.ts`, which starts
  with `import 'server-only'` — a client-component import becomes a build
  error, not a runtime leak.
- `sanity/lib/client.ts` and `sanity/lib/fetch.ts` are `server-only` too, so
  the token cannot be reached transitively.
- Only `NEXT_PUBLIC_SANITY_PROJECT_ID` / `_DATASET` / `_API_VERSION` reach the
  browser, and only through `sanity/lib/image.ts`, which builds CDN image URLs
  and needs no credentials.
- The client is read-only: no write token exists in the web workspace at all.
  Progress writes (a later pass) get their own server route and token.
- `perspective: 'published'` keeps drafts out of the site.
- `.env.example` stays the canonical list (AGENTS.md §12); `.env.local` is
  never read into the prompt or printed.

## Acceptance criteria

1. `studio/` runs on its own (`npm run dev` → :3333), lists Courses, Lessons,
   Instructors, Categories, and every type shows an icon and a useful preview.
2. No Studio code remains in the Next.js app: `app/studio/` is gone and the
   root has no `sanity.config.ts` / `sanity.cli.ts`.
3. `sanity.types.ts` is generated at the repo root and contains a
   `*_QUERY_RESULT` type for every exported query.
4. Importing `sanity/lib/client.ts` from a client component fails the build.
5. Web type check, lint, and production build all pass.
6. Pages render exactly as before — this pass changes no UI.

## Checks to run

From the repo root (web workspace):

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` and load `/` and `/style-guide`

From `studio/`:

- `npm run typegen` (`sanity schemas extract --force && sanity typegen generate`)
- `npm run dev`, and `npm run deploy` once the user is logged in — required
  before the Context MCP will serve the dataset (AGENTS.md §12), so it is
  reported as a follow-up rather than run blind.

## Manual test steps

1. `cd studio && npm install && npm run dev` → open http://localhost:3333.
2. Create one `instructor`, one `category`, and two `lesson` documents with
   real durations and a video URL.
3. Create one `course`: fill the marketing fields, add two outcomes, reference
   the instructor and category, add one module and drag both lessons into it.
   Confirm validation blocks saving with zero modules.
4. Back at the repo root, `npm run dev`, then in a scratch server component (or
   via Vision in the Studio) run `COURSES_CATALOG_QUERY` and confirm it returns
   the course with `moduleCount: 1`, `lessonCount: 2`, and the summed duration.
5. Confirm `sanity.types.ts` types that result — hovering the fetch result
   shows the projected fields, not `any`.
