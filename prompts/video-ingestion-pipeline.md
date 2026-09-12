# Video ingestion pipeline — `video` documents with chapters and transcript chunks

## Goal

Build the offline tooling of AGENTS.md §9: one `video` document per unique video URL,
holding the source's **chapter markers** (the table of contents) and the transcript as
**many short timestamped chunks**. This is the data that lets search resolve a query to
an exact second — chapters first, transcript as the backstop (§7).

Scope is the pipeline and the schema **only**. Wiring VIDEO result cards into `/search`
is the next, separate task (`prompts/vertex-intelligent-search.md` deferred them
explicitly). Nothing in the request path changes here.

## Skills read

- `.agents/skills/sanity-best-practices/SKILL.md` — `defineType`/`defineField`, document
  vs. object modelling, TypeGen workflow (`sanity schemas extract && sanity typegen
  generate`), and the rule that generated types are never hand-edited.
- `.agents/skills/content-modeling-best-practices/references/reference-vs-embedding.md`
  — chapters and chunks are embedded objects (they have no life outside their video);
  the video itself is a document (one per URL, many lessons may share it).
- `.agents/skills/dial-your-context/SKILL.md` — Instructions stay pure deltas; the
  `groqFilter` decides what the agent can see at all.
- AGENTS.md §7 (two-stage timestamp resolution), §8 (the `video` shape), §9 (ingestion
  is offline, keyed by an id derived from the URL, whole transcripts never returned),
  §11, §12 (never return a whole chunks array to the model), §13 (checks).

Not read: `node_modules/next/dist/docs/` — this task touches no Next.js route, server
module, or component. Only `sanity.types.ts` changes on the web side, as TypeGen output.

## Code inspected

- `studio/schemaTypes/index.ts` — 4 documents, 4 objects, all registered in one array.
  There is **no** `video` type yet.
- `studio/schemaTypes/documents/lesson.ts` — `videoUrl` is a `url` field validated
  against a `SUPPORTED_VIDEO_HOSTS` list (YouTube, Vimeo, Bunny hosts). The lesson does
  **not** reference a video document, and must not start to: §8 says lessons link to
  videos *by video URL*.
- `sanity/lib/video.ts` — already parses all three providers out of a URL (`youtubeId`,
  `vimeoId`, `bunnyIds`) and builds seek-capable embeds. The pipeline must derive ids the
  same way, not with a second, divergent parser.
- `studio/scripts/seed/prepare.mjs` + `import.mjs` — the established convention: a pure
  `prepare.mjs` that reads committed inputs and writes `.out/*.ndjson`, and an
  `import.mjs` that runs prepare then `sanity dataset import --replace`, resolving the
  dataset from `SANITY_STUDIO_DATASET` / `studio/.env.local`. `studio/scripts/context/`
  follows the same pair.
- `studio/scripts/seed/videos.json` — 120 entries keyed by lesson slug, each
  `{id, title, channel, duration, query}`. All 120 are YouTube. `prepare.mjs` already
  cross-checks every lesson's `videoUrl` and duration against it, and its comment names
  the §9 pipeline as the owner of ingestion.
- `studio/structure.ts` — an explicit Content list; a new type is invisible unless added.
- `studio/sanity.cli.ts` — TypeGen reads `../{app,sanity}/**/*.ts(x)` against
  `schema.json` and writes `../sanity.types.ts`.
- `studio/scripts/context/prepare.mjs` — `groqFilter` is
  `_type in ["course","lesson","instructor","category"]` today.
- `.gitignore` — `/studio/scripts/seed/.out` and `/studio/scripts/context/.out` are
  ignored; `seed.ndjson` (392 KB) and `videos.json` are committed inputs.

## Decisions and assumptions

1. **Caption + chapter source: YouTube's InnerTube endpoints, over plain `fetch`.**
   Verified live during research: `POST youtubei/v1/player` (ANDROID client) returns a
   `captionTracks[]` whose `baseUrl` serves timed text, and `POST youtubei/v1/next` (WEB
   client) returns `macroMarkersListRenderer` → `chapterRenderer` entries with
   `timeRangeStartMillis` and a title. No API key, no `yt-dlp`, no new dependency — none
   of which are installed here. These endpoints are unofficial and can break, which
   drives decision 2.
2. **Fetched transcripts are committed as a source file**,
   `studio/scripts/ingest/sources/transcripts.ndjson` (one normalised line per video:
   provider, id, url, title, `chapters[]`, `cues[]`). Rationale: it makes `prepare.mjs`
   deterministic and fully offline like `seed.ndjson`, and it is the provenance record if
   the unofficial endpoints stop working. Expected size ~1–2 MB for 120 videos; that is
   the cost of not depending on a scraping endpoint at build time. `.out/` stays
   gitignored.
3. **Three stages, mirroring the seed convention.** `fetch.mjs` (network, writes the
   source file, incremental — skips videos already present unless `--force`),
   `prepare.mjs` (pure, source file → `video` documents ndjson), `import.mjs` (prepare +
   `sanity dataset import --replace`). Only `fetch.mjs` touches the network, and none of
   it ever runs in the request path.
4. **Provider parsing is shared, not duplicated.** `studio/scripts/ingest/providers.mjs`
   ports the URL→`{provider, id}` logic from `sanity/lib/video.ts`. It cannot import that
   file across the workspace boundary (the Studio is standalone, and that file is
   TypeScript), so it is a deliberate, commented port kept narrow: identification only,
   no embed building. Vimeo and Bunny are **identified** but ingestion throws
   `unsupported provider` for them — §9: a provider is not supported until ingestion
   *and* playback both exist, and no lesson uses them.
5. **Document id:** `video-<provider>-<sanitised id>`, sanitising anything outside
   `[A-Za-z0-9._-]` to `-` and appending a short sha1 prefix of the raw id whenever
   sanitising changed it, so two different source ids can never collapse onto one
   document (§9).
6. **Chunking:** caption cues are merged in order into chunks of up to ~320 characters or
   ~30 seconds, whichever comes first, never splitting a cue. Each chunk stores the
   integer `startSeconds` of its first cue. Text is HTML-entity-decoded, whitespace
   collapsed, and `[Music]`-style caption artefacts dropped. This keeps chunks short
   enough that a filtered GROQ match returns a few rows, never a wall of text (§12).
7. **Chapters:** taken from the source's own markers when present. When a video has none,
   `chapters` is written as an empty array — not invented — and §7's transcript fallback
   carries the query. No chapter is authored by hand in this task.
8. **The `video` type is machine-owned.** It appears in the Studio under a "Video
   intelligence" list for inspection, with `readOnly: true` fields and creation disabled,
   so an author cannot hand-edit data the pipeline will overwrite.
9. **The Context document gains the `video` type** in its `groqFilter`, plus two delta
   instructions: video documents are an internal lookup that is never returned as a
   result, and `chunks`/`chapters` are only ever queried filtered, never projected whole.
   Without this the ingested data is invisible to the agent and the pipeline ships dead.
   The same two rules are **not** added to the inline system prompt yet — that prompt
   describes lesson-only search today and gets rewritten as one piece when VIDEO cards
   land (§12 wants the critical rules in both places, at that point).

## Files

New:

- `studio/schemaTypes/documents/video.ts` — the `video` document.
- `studio/schemaTypes/objects/video-chapter.ts` — `{startSeconds, label}`.
- `studio/schemaTypes/objects/video-chunk.ts` — `{startSeconds, text}`.
- `studio/scripts/ingest/providers.mjs` — URL → `{provider, id}`, plus the id sanitiser.
- `studio/scripts/ingest/youtube.mjs` — InnerTube captions + chapters → normalised source.
- `studio/scripts/ingest/fetch.mjs` — network stage, writes/updates the source file.
- `studio/scripts/ingest/chunk.mjs` — cue merging and text cleanup (pure).
- `studio/scripts/ingest/prepare.mjs` — source file → `.out/videos.ndjson`.
- `studio/scripts/ingest/import.mjs` — prepare + `sanity dataset import --replace`.
- `studio/scripts/ingest/sources/transcripts.ndjson` — committed fetched output.

Changed:

- `studio/schemaTypes/index.ts` — register `video`, `videoChapter`, `videoChunk`.
- `studio/structure.ts` — a "Video intelligence" list item, below a divider.
- `studio/package.json` — `ingest:fetch`, `ingest:prepare`, `ingest:import` scripts.
- `studio/scripts/context/prepare.mjs` — `groqFilter` plus two delta instructions.
- `.gitignore` — ignore `/studio/scripts/ingest/.out`.
- `sanity.types.ts` — regenerated by TypeGen, never hand-edited.
- `README.md` — the ingestion commands, in the Checks and repo-layout sections.

Not changed: every file under `app/`, `sanity/lib/` (including `video.ts`), and
`studio/schemaTypes/documents/lesson.ts`.

## Requirements

- One `video` document per unique video URL — 120 lessons may map to fewer documents if
  any share a URL; dedupe on the derived id, and fail loudly if two different URLs
  collide onto one id.
- `chapters` ascending by `startSeconds`, each with a non-empty `label`.
- `chunks` ascending by `startSeconds`, each with non-empty `text`; no chunk longer than
  the configured cap; no whole-transcript field anywhere on the document.
- `fetch.mjs` is sequential with a small delay between videos, retries a failed video
  once, and reports failures at the end instead of aborting the run — a single video
  without captions must not lose the other 119.
- `prepare.mjs` performs no network I/O and is idempotent: same source file,
  byte-identical ndjson.
- `prepare.mjs` cross-checks the source file against `seed/videos.json` and fails if a
  lesson's video has no ingested source, the way `seed/prepare.mjs` already guards drift.
- Every script runs from `studio/` and prints what it wrote, matching the existing pair.

## Security

- No token and no secret is involved in `fetch.mjs`; it reads public endpoints only.
- `import.mjs` shells out to the local `sanity` binary, which resolves credentials the
  same way the seed import already does. No write token is introduced into the repo, and
  nothing here is reachable from the browser or from a request path.
- Fetched caption text is untrusted third-party content: it is decoded and
  whitespace-collapsed, never interpolated into a shell command, and stored as plain
  strings in typed fields — never as Portable Text or HTML.
- `sanity dataset import --replace` upserts and never deletes, so a bad run cannot wipe
  authored content.

## Acceptance criteria

1. `studio/schemaTypes/index.ts` registers `video`, `videoChapter`, `videoChunk`, and the
   Studio renders a read-only "Video intelligence" list.
2. `npm run ingest:fetch` in `studio/` produces `sources/transcripts.ndjson` covering all
   120 lessons' videos, reporting any video whose captions are unavailable.
3. `npm run ingest:prepare` turns that into `.out/videos.ndjson` of `video` documents,
   offline, with chapters and chunks ordered and within the size caps.
4. `npm run ingest:import` lands them in the dataset; a GROQ query in Vision returns
   matching chunks for a keyword and never the whole array.
5. `sanity.types.ts` contains the generated `Video` type after `npm run typegen`.
6. The Context document's filter includes `video` after `npm run context:import`.
7. Lessons, courses, the search route, and every page are untouched and still build.

## Checks to run

```bash
cd studio
npm run ingest:fetch          # network stage, ~120 videos
npm run ingest:prepare        # offline transform
npm run ingest:import         # dataset import
npm run typegen               # regenerates ../sanity.types.ts
npm run context:prepare && npm run context:import

cd ..
npx tsc --noEmit
npm run lint
npm run build                 # schema/TypeGen changes reach the web types
```

Report the real output of each. Search behaviour is verified against the live MCP in the
follow-up task that consumes these documents, not here.

## Manual test steps

1. `cd studio && npm run dev`, open http://localhost:3333, click **Video intelligence**.
   A video document lists chapters and chunks, and every field is read-only.
2. Open the Vision tool and run
   `*[_type == "video" && count(chunks[text match "rout*"]) > 0][0]{id, url, "hits": chunks[text match "rout*"][0...3]}`
   — a handful of timestamped chunks come back, not the whole array.
3. Run `*[_type == "video" && count(chapters) > 0][0]{id, chapters}` — chapter labels are
   the video's own, ascending, and the first starts at 0.
4. Take a `startSeconds` from step 2, open the lesson using that video at
   `http://localhost:3000/lessons/<slug>?t=<startSeconds>`, press play: the embed starts
   at that second and the transcript text matches what is said there.
5. Re-run `npm run ingest:prepare` — the output is byte-identical, and `git status` shows
   no change to `sources/transcripts.ndjson`.
