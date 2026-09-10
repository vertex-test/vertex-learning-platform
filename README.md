# vertex-learning-platform

Vertex is an AI-powered learning platform with intelligent content search. Authors
create courses in Sanity; a Next.js site serves them to learners. A learner types a
plain-language query and gets back ranked, clickable cards — each linking to the
exact second in a lesson's video where that topic is taught, played on the site.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind v4
- **Sanity** for the content model, via `next-sanity`
- **Clerk** for authentication
- **PostHog** for product analytics
- **Sanity Context MCP** + Vercel AI SDK for search

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npx tsc --noEmit   # types
npm run lint       # lint
npm run build      # production build
```

## Design system

The visual language lives in `app/globals.css` (tokens) and `app/components/ui/`
(primitives: buttons, inputs, badges, status indicators, progress, cards,
navigation). Reference designs are in `design/`.

`/style-guide` renders every token and primitive side by side so it can be diffed
against `design/vertex-designsystem.png`.

## Repo layout

| Path                 | What's in it                                     |
| -------------------- | ------------------------------------------------ |
| `app/`               | Next.js routes and UI components                 |
| `design/`            | Design reference images (source of truth for UI) |
| `prompts/`           | Implementation prompts, one per work item        |
| `.agents/skills/`    | Vendored agent skills (pinned by `skills-lock.json`) |
| `AGENTS.md`          | How this project is built and what it must do    |
