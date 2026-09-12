/**
 * Writes the `sanity.agentContext` document the Context MCP serves (AGENTS.md §10).
 *
 * The instructions live here as a plain string rather than in the Studio because
 * the `@sanity/context` plugin peers on `sanity ^6` and this Studio is on `^5`
 * (AGENTS.md §12) — so the document is authored by import, not in the editor.
 *
 * Keep the instructions as *pure deltas* (dial-your-context): only what the
 * auto-generated schema does not already make obvious. Anything the agent can
 * read off the schema is noise here, and noise costs accuracy.
 *
 *   node scripts/context/prepare.mjs [outFile]
 */
import {mkdirSync, writeFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const contextDir = dirname(fileURLToPath(import.meta.url))
const outFile = resolve(process.argv[2] ?? join(contextDir, '.out', 'context.ndjson'))

/** The slug that closes the MCP URL: .../context/mcp/:projectId/:dataset/vertex-search */
export const SLUG = 'vertex-search'

/** Content types only — the agent never needs anything else in the dataset. */
const groqFilter = '_type in ["course", "lesson", "instructor", "category"]'

const instructions = `
Vertex is a course platform. Learners search for where a topic is taught.

## Relationships the schema does not connect

- A lesson does not store its parent course. Find it with a reverse reference:
  \`*[_type == "course" && references($lessonId)][0]\`.
- \`course.modules\` is an array of embedded objects, each with \`lessons\`, an
  ordered array of references to lesson documents.

## Do not quote these — they are not stored

- Module and lesson numbers ("Module 5", "Lesson 5.1") are derived from array
  order, never stored. Never state one.
- \`durationSeconds\` is seconds. Do not present it as minutes.

## Matching text

- Text match is token based. Wildcard every keyword and OR them:
  \`title match "fetch*" || title match "cach*"\`. Never match a whole phrase as
  one pattern — "data fetching" as a single \`match\` returns nothing.
- \`lesson.notes\` is Portable Text and cannot be matched directly. Match its
  plain text projection: \`pt::text(notes) match "fetch*"\`.
- Never project \`notes\` itself. Project at most \`pt::text(notes)[0...300]\`.
- If \`text::semanticSimilarity()\` errors with embeddings not enabled, fall back
  to keyword matching with wildcards.

## Ranking

Rank by specificity. A lesson whose \`title\` contains the concept outranks one
that only mentions it in \`notes\`, which outranks a match on the course alone.
`.trim()

const doc = {
  _id: `sanity.agentContext.${SLUG}`,
  _type: 'sanity.agentContext',
  slug: {_type: 'slug', current: SLUG},
  groqFilter,
  instructions,
}

mkdirSync(dirname(outFile), {recursive: true})
writeFileSync(outFile, `${JSON.stringify(doc)}\n`, 'utf8')
console.log(`wrote ${outFile}`)
