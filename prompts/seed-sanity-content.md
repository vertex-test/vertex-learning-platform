# Seed Sanity from the provided seed files

## Goal

Populate the `xxdqhkai` / `production` dataset with the content already authored in
`studio/scripts/seed/seed.ndjson` (141 documents) using `sanity dataset import`, then verify
the document counts. Use the provided files as the sole source of content — generate no new
courses, lessons, instructors, categories or copy — and do not modify either seed file.

## Skills / docs read

- `AGENTS.md` §2 (workflow), §5 (two workspaces; Studio owns content), §8 (the data model),
  §12 (private dataset, tokens stay server-side), §13 (checks, Studio import).
- `sanity-best-practices` — dataset import, `_sanityAsset` asset ingestion, TypeGen.
- Sanity CLI 6.7.2 `dataset import` behaviour (strong reference validation, `--replace`).

## Code / data inspected

- `studio/schemaTypes/**` — `course`, `lesson`, `instructor`, `category`, plus the
  `courseModule`, `learningOutcome`, `lessonResource`, `blockContent` objects.
- `sanity/lib/queries.ts`, `sanity/lib/derive.ts`, `sanity.types.ts` — the web read layer,
  already written against the current schema field names.
- `studio/scripts/seed/seed.ndjson` — 10 course, 120 lesson, 5 instructor, 6 category.
  All references resolve, every lesson is referenced by exactly one module, no orphans.
- `studio/scripts/seed/videos.json` — 120 entries keyed by lesson slug, 120 unique video ids.
  Checked 1:1 against the lessons at inspection time — same slug set, matching YouTube id in
  `videoUrl`, matching duration, matching thumbnail URL. The guard in `prepare.mjs` re-checks
  the first three of those on every run; it does not compare thumbnail URLs.
- `sanity debug` — CLI logged in as administrator on `xxdqhkai`, dataset `production`.
- Dataset pre-state: 12 documents, all `system.*`. No content, no assets.

## Decisions and assumptions

1. **The seed file is authored against slightly different field names than the committed
   schema.** The import API does not validate against the schema, so importing verbatim would
   land fields the Studio shows as "unknown" and the web queries return as null. The web read
   layer (queries, derive, generated types) is already built on the schema names, so I map the
   seed onto the schema rather than renaming the schema. The mapping is mechanical — no wording
   is changed:

   | seed.ndjson | schema |
   |---|---|
   | `lesson.thumbnail` | `lesson.poster` |
   | `lesson.duration` | `lesson.durationSeconds` |
   | `lesson.resources[]._type: "resource"` | `lessonResource` |
   | `course.learningOutcomes` | `course.outcomes` |
   | `course.modules[]._type: "module"` | `courseModule` |

2. **`lesson.summary` is required by the schema and absent from the seed.** I take it from the
   lesson's own first notes paragraph (plain text of `notes[0]`). Checked: all 120 are
   93–181 chars, inside the 200-char limit. This is existing seed copy, not new content.

3. **Two enum value sets in the schema are narrower than the seed.** Rather than rewrite seed
   values, I widen the Studio option lists so the provided values stay verbatim:
   - `lessonResource.type` gains `{title: 'Link', value: 'link'}` (all seed resources use `link`).
   - `learningOutcome.icon` gains `code`, `workflow`, `rocket`, `puzzle`, `sparkles`
     (seed also uses `layers`, `gauge`, `shield`, which already exist). No web code reads icon
     values yet, so this is a Studio-only list change.

4. **The transform runs into a generated copy in the scratchpad; the two seed files are read
   only and stay byte-identical.** A small committed script, `studio/scripts/seed/prepare.mjs`,
   does the mapping so the import is reproducible rather than a one-off shell pipeline.

5. **No `video` documents in this task.** There is no `video` schema type yet, and `videos.json`
   carries no chapters or transcript chunks — it is the provenance map for the lessons' videos
   and the input the §9 ingestion pipeline will later use. Building video documents is that
   task, not this one.

6. **Assets.** 135 `_sanityAsset` image URLs (picsum covers, randomuser portraits, ytimg
   thumbnails) are downloaded and uploaded by the importer. This needs network and is the slow
   part of the run.

7. **Target and safety.** Import into `production` (the dataset both workspaces already point
   at), with `--replace`. That makes the run an upsert: re-running overwrites documents with
   the same `_id`, but it never deletes anything, so a document dropped from the seed would
   linger in the dataset until it is removed by hand. The import does not clear the dataset
   first — clearing is destructive and out of scope here. The dataset holds no content today,
   so nothing is overwritten on this run. CLI auth is used; no token is added to any file.

## Files I expect to touch

- `studio/scripts/seed/prepare.mjs` (new) — reads the two seed files, writes the mapped ndjson.
- `studio/package.json` — add `seed:prepare` and `seed:import` scripts.
- `studio/schemaTypes/objects/lesson-resource.ts` — add the `link` option.
- `studio/schemaTypes/objects/learning-outcome.ts` — add the five icon options.
- `prompts/seed-sanity-content.md` (this file).
- Not touched: `seed.ndjson`, `videos.json`, the web workspace, any query or generated type.

## Requirements

- Content in the dataset comes only from the two provided files (plus the derived summary).
- `sanity dataset import` is the import path, not a hand-rolled client script.
- The seed files are unchanged (verified by hash before and after).
- Post-import counts verified by GROQ: 10 course, 120 lesson, 5 instructor, 6 category,
  135 image assets, and zero unresolved references.

## Security considerations

- No token is written to any file or passed on the command line; the CLI's own session is used.
- `SANITY_API_READ_TOKEN` stays in `studio/.env.local` / `.env.local`, untracked and server-only.
- The dataset stays private (AGENTS.md §12). Nothing here exposes a credential to the browser.
- `prepare.mjs` is offline tooling and never runs in a request path.

## Acceptance criteria

1. `sanity dataset import` completes with no reference errors.
2. GROQ counts are exactly 10 / 120 / 5 / 6 and 135 image assets.
3. A spot-checked course returns a populated `outcomes`, `modules[].lessons[]->`, and a lesson
   returns `poster`, `durationSeconds`, `summary`, `keyPoints`, `resources`.
4. `git diff --stat` shows no change to the two seed files.

## Checks to run

- `studio`: `npm run typegen` (schema extract + TypeGen, since two schema files change).
- web (repo root): `npx tsc --noEmit` and `npm run lint` — no routes or server code change, so
  no production build is required, but I will run `npm run build` if TypeGen alters
  `sanity.types.ts`.
- Verification GROQ queries via `sanity documents query`.

## Manual test steps

1. `cd studio && npm run dev`, open the Studio, confirm 10 courses / 120 lessons / 5
   instructors / 6 categories in the desk.
2. Open "Next.js App Router in Depth": cover image renders, instructor and category resolve,
   4 modules each listing their lessons in order.
3. Open the lesson "File-system routing and the app directory": poster image, duration 350,
   summary, key points, notes, one resource, free preview on. No "unknown field" warnings.
4. Open an instructor: photo, expertise tags, two bio paragraphs.
