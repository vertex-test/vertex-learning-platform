/**
 * Caption cues → transcript chunks (AGENTS.md §8, §9).
 *
 * Pure and offline: the same source file always produces the same chunks, which
 * is what lets `prepare.mjs` be re-run without touching the network.
 *
 * Chunks are deliberately short. A query matches a handful of them and returns
 * only those; a long chunk — never mind a whole transcript — overflows the
 * model's context window (AGENTS.md §12).
 */

/** Caps, whichever is reached first. Chosen so a matched chunk reads as a sentence or two. */
export const MAX_CHUNK_CHARS = 320
export const MAX_CHUNK_SECONDS = 30

/** Caption artefacts that carry no words: `[Music]`, `[Applause]`, `>>`. */
const ARTEFACT = /\[[^\]]*\]|^>>+/g

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
  nbsp: ' ',
}

/** Caption text is untrusted third-party content — decoded to plain text, never markup. */
export function cleanCueText(raw) {
  return String(raw ?? '')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
      const key = entity.toLowerCase()
      if (key in ENTITIES) return ENTITIES[key]

      if (key.startsWith('#')) {
        const code = key.startsWith('#x')
          ? Number.parseInt(key.slice(2), 16)
          : Number.parseInt(key.slice(1), 10)
        if (Number.isFinite(code) && code > 0 && code <= 0x10ffff) {
          return String.fromCodePoint(code)
        }
      }

      return match
    })
    .replace(ARTEFACT, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Merges cues in order until a cap is hit, never splitting a cue. Each chunk
 * takes the `startSeconds` of its first cue, so the timestamp always points at
 * the moment the text begins.
 */
export function chunkCues(cues) {
  const chunks = []
  let current = null

  const flush = () => {
    if (current && current.text) chunks.push(current)
    current = null
  }

  for (const cue of cues ?? []) {
    const text = cleanCueText(cue?.text)
    if (!text) continue

    const startSeconds = Math.max(0, Math.floor(cue?.startSeconds ?? 0))

    if (!current) {
      current = {startSeconds, text}
      continue
    }

    const merged = `${current.text} ${text}`
    const tooLong = merged.length > MAX_CHUNK_CHARS
    const tooOld = startSeconds - current.startSeconds >= MAX_CHUNK_SECONDS

    if (tooLong || tooOld) {
      flush()
      current = {startSeconds, text}
      continue
    }

    current.text = merged
  }
  flush()

  return chunks.sort((a, b) => a.startSeconds - b.startSeconds)
}

/** Chapter labels get the same cleanup, and the same "no empty entries" rule. */
export function cleanChapters(chapters) {
  const cleaned = (chapters ?? [])
    .map((chapter) => ({
      startSeconds: Math.max(0, Math.floor(chapter?.startSeconds ?? 0)),
      label: cleanCueText(chapter?.label),
    }))
    .filter((chapter) => chapter.label)

  const byStart = new Map()
  for (const chapter of cleaned) {
    if (!byStart.has(chapter.startSeconds)) byStart.set(chapter.startSeconds, chapter)
  }

  return [...byStart.values()].sort((a, b) => a.startSeconds - b.startSeconds)
}
