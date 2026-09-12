# Vertex Studio

The Sanity Studio for Vertex: the content model and authoring workspace. It is
standalone on purpose (AGENTS.md §5) — that is what keeps Studio auto-updates,
fast Vite builds, and TypeGen watch mode.

```bash
cp .env.example .env.local   # same project id and dataset as the web app
npm install
npm run dev                  # http://localhost:3333
npm run typegen              # regenerates ../sanity.types.ts
npm run deploy               # required before the Context MCP serves this dataset
npm run context:import       # writes the search agent's Context document (§10)
```

`npm run deploy` comes first: the Context MCP refuses a dataset that has no
deployed Studio application, and a schema-only deploy is not enough (§12).

`context:import` regenerates `scripts/context/.out/context.ndjson` from
`scripts/context/prepare.mjs` and upserts it. The instructions and the content
filter are edited in that script — the `@sanity/context` Studio plugin peers on
`sanity ^6` while this Studio is on `^5`, so the document is authored by import
rather than in the editor (§12).

The web app lives at the repo root and runs separately with `npm run dev`.
