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
```

The web app lives at the repo root and runs separately with `npm run dev`.
