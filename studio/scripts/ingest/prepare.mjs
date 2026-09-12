/**
 * Turns the committed transcript sources into `video` documents (AGENTS.md §8, §9).
 *
 * Pure and offline — no network, no provider, no surprises. The same source file
 * always produces byte-identical ndjson, so a re-run is a no-op and a diff means
 * the sources really changed.
 *
 *   node scripts/ingest/prepare.mjs [outFile] [--allow-partial]
 */
import {createHash} from 'node:crypto'
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import {chunkCues, cleanChapters, MAX_CHUNK_CHARS} from './chunk.mjs'
import {identifyVideo, videoDocumentId} from './providers.mjs'

const ingestDir = dirname(fileURLToPath(import.meta.url))
const sourcesFile = join(ingestDir, 'sources', 'transcripts.ndjson')
const seedFile = join(ingestDir, '..', 'seed', 'seed.ndjson')
const args = process.argv.slice(2)

/**
 * Ingestion is best-effort against a provider that throttles: `--allow-partial`
 * imports the videos that were fetched and reports the lessons still missing,
 * instead of blocking every searchable moment on the last transcript.
 */
const allowPartial = args.includes('--allow-partial')
const outFile = resolve(args.find((arg) => !arg.startsWith('--')) ?? join(ingestDir, '.out', 'videos.ndjson'))

function readNdjson(file) {
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line))
}

/**
 * A stable `_key` per array item: derived from the content, so re-importing a
 * video does not churn every key and the diff stays readable.
 */
function keyed(items, prefix) {
  return items.map((item, index) => ({
    ...item,
    _type: prefix,
    _key: `${String(index).padStart(4, '0')}-${createHash('sha1')
      .update(`${item.startSeconds}:${item.label ?? item.text}`)
      .digest('hex')
      .slice(0, 8)}`,
  }))
}

const sources = readNdjson(sourcesFile)
if (sources.length === 0) {
  console.error(`no sources at ${sourcesFile} — run: node scripts/ingest/fetch.mjs`)
  process.exit(1)
}

const documents = []
const byDocumentId = new Map()

for (const source of sources) {
  const identified = identifyVideo(source.url)
  if (!identified) throw new Error(`${source.id}: unrecognised video URL ${source.url}`)
  if (identified.id !== source.id) {
    throw new Error(`${source.url}: source id ${source.id} does not match parsed ${identified.id}`)
  }

  const _id = videoDocumentId(identified)
  const collision = byDocumentId.get(_id)
  if (collision && collision !== source.url) {
    throw new Error(`document id ${_id} reached from two URLs: ${collision} and ${source.url}`)
  }
  byDocumentId.set(_id, source.url)

  const chapters = cleanChapters(source.chapters)
  const chunks = chunkCues(source.cues)

  if (chunks.length === 0) throw new Error(`${source.id}: no transcript chunks`)

  const oversized = chunks.find((chunk) => chunk.text.length > MAX_CHUNK_CHARS)
  if (oversized) {
    throw new Error(`${source.id}: chunk at ${oversized.startSeconds}s is ${oversized.text.length} chars`)
  }

  documents.push({
    _id,
    _type: 'video',
    id: source.id,
    url: source.url,
    provider: identified.provider,
    ...(source.title ? {title: source.title} : {}),
    chapters: keyed(chapters, 'videoChapter'),
    chunks: keyed(chunks, 'videoChunk'),
  })
}

// The lessons are the reason these documents exist: a lesson whose video was
// never ingested would silently have no searchable moments, so stop instead.
const lessons = readNdjson(seedFile).filter((doc) => doc._type === 'lesson')
const ingested = new Set(sources.map((source) => source.id))
const missing = lessons
  .filter((lesson) => {
    const identified = identifyVideo(lesson.videoUrl)
    return !identified || !ingested.has(identified.id)
  })
  .map((lesson) => lesson.slug?.current ?? lesson._id)

if (missing.length > 0) {
  const detail = `${missing.length}/${lessons.length} lesson(s) have no ingested video`

  if (!allowPartial) {
    throw new Error(
      `${detail}: ${missing.join(', ')}\n` +
        'Run: node scripts/ingest/fetch.mjs — or re-run with --allow-partial to ' +
        'import the videos that are ingested.',
    )
  }

  console.warn(`WARNING: ${detail}. Re-run scripts/ingest/fetch.mjs to complete them.`)
  console.warn(`  missing: ${missing.join(', ')}`)
}

mkdirSync(dirname(outFile), {recursive: true})
writeFileSync(outFile, documents.map((doc) => JSON.stringify(doc)).join('\n') + '\n', 'utf8')

const chapterCount = documents.reduce((total, doc) => total + doc.chapters.length, 0)
const chunkCount = documents.reduce((total, doc) => total + doc.chunks.length, 0)
const withChapters = documents.filter((doc) => doc.chapters.length > 0).length

console.log(`transcripts.ndjson  ${createHash('md5').update(readFileSync(sourcesFile)).digest('hex')}`)
console.log(`wrote ${outFile}`)
console.log(`  ${documents.length} video`)
console.log(`  ${chapterCount} chapters across ${withChapters} videos`)
console.log(`  ${chunkCount} transcript chunks`)
