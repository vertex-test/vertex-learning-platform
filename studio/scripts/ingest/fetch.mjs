/**
 * The network stage of the ingestion pipeline (AGENTS.md §9).
 *
 * Reads every lesson's `videoUrl` from the seed, fetches that video's captions
 * and chapter markers from its provider, and writes one normalised line per
 * video to `sources/transcripts.ndjson`.
 *
 * That file is committed on purpose. It makes `prepare.mjs` deterministic and
 * fully offline, and it is the provenance record if a provider's endpoints
 * change under us. This is the only script here that touches the network, and it
 * never runs in the request path.
 *
 * Incremental: videos already in the source file are skipped, so a re-run costs
 * nothing and a failed video can be retried on its own.
 *
 *   node scripts/ingest/fetch.mjs [--force] [--only <videoId|lesson-slug>] [--limit N]
 */
import {existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {chunkCues} from './chunk.mjs'
import {identifyVideo, videoKey} from './providers.mjs'
import {fetchYouTubeSource} from './youtube.mjs'

const ingestDir = dirname(fileURLToPath(import.meta.url))
const seedFile = join(ingestDir, '..', 'seed', 'seed.ndjson')
const sourcesFile = join(ingestDir, 'sources', 'transcripts.ndjson')

/**
 * Courtesy delay between videos, with jitter. This is a public endpoint, not an
 * API: fetching 120 transcripts back to back gets the run throttled, and a slower
 * run that finishes beats a fast one that does not.
 */
const DELAY_MS = 3000

/**
 * Backoff for a retryable failure. The caption endpoint starts answering 429
 * after a few dozen videos in a row, and it recovers within a minute or two, so
 * waiting is the fix — not a smaller run.
 */
const BACKOFF_MS = [15_000, 45_000, 120_000]

/**
 * Once this many videos in a row fail even after backing off, the endpoint is
 * throttling the whole run rather than hiccuping. Stop and say so — the source
 * file already holds everything fetched so far, and re-running resumes.
 */
const MAX_CONSECUTIVE_FAILURES = 4

const args = process.argv.slice(2)
const flagValue = (flag) => {
  const index = args.indexOf(flag)
  return index === -1 ? undefined : args[index + 1]
}

const force = args.includes('--force')
const only = flagValue('--only')
const limitArg = Number(flagValue('--limit'))
const limit = Number.isFinite(limitArg) && limitArg > 0 ? limitArg : Infinity

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function readNdjson(file) {
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line))
}

/** Every distinct video the lessons point at — one document per URL (AGENTS.md §8). */
function videoTargets() {
  const byKey = new Map()

  for (const doc of readNdjson(seedFile)) {
    if (doc._type !== 'lesson' || !doc.videoUrl) continue

    const identified = identifyVideo(doc.videoUrl)
    if (!identified) throw new Error(`${doc._id}: unrecognised video URL ${doc.videoUrl}`)

    const slug = doc.slug?.current ?? doc._id
    const key = videoKey(identified)
    const existing = byKey.get(key)

    if (existing) {
      if (existing.url !== doc.videoUrl) {
        throw new Error(
          `video ${key} reached from two URLs: ${existing.url} and ${doc.videoUrl}`,
        )
      }
      existing.slugs.push(slug)
      continue
    }

    byKey.set(key, {...identified, url: doc.videoUrl, slugs: [slug]})
  }

  return [...byKey.values()]
}

async function fetchSource(target) {
  if (target.provider === 'youtube') return fetchYouTubeSource(target)

  // A provider is not supported until both ingestion and playback exist for it
  // (AGENTS.md §9). Playback exists for all three; ingestion does not.
  throw new Error(`unsupported provider "${target.provider}" — no ingestion for it yet`)
}

/** Rate limiting and transient server errors are worth waiting out; nothing else is. */
function isRetryable(error) {
  return (
    /responded (429|5\d\d)/.test(error.message) ||
    /fetch failed|ETIMEDOUT|ECONNRESET/.test(error.message) ||
    // A request that hit youtube.mjs's timeout. Worth waiting out, like a 429.
    error.name === 'TimeoutError' ||
    error.name === 'AbortError'
  )
}

/** Retries a throttled video with growing backoff rather than losing it for the run. */
async function fetchWithRetry(target, onWait) {
  let lastError

  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt += 1) {
    try {
      return await fetchSource(target)
    } catch (error) {
      lastError = error
      if (!isRetryable(error) || attempt === BACKOFF_MS.length) throw error

      const wait = BACKOFF_MS[attempt]
      onWait(error, wait)
      await sleep(wait)
    }
  }

  throw lastError
}

const targets = videoTargets()
const existing = new Map(readNdjson(sourcesFile).map((source) => [videoKey(source), source]))

const selected = targets
  .filter((target) => !only || target.id === only || target.slugs.includes(only))
  .filter((target) => force || only || !existing.has(videoKey(target)))
  .slice(0, limit)

if (only && selected.length === 0) {
  console.error(`no video matches --only ${only}`)
  process.exit(1)
}

console.log(
  `${targets.length} videos across the seed · ${existing.size} already ingested · fetching ${selected.length}`,
)

const failures = []
let consecutiveFailures = 0

/**
 * Written after every success, not once at the end: a long run that is
 * interrupted or throttled keeps the videos it already has, and the next run
 * picks up from there.
 */
function writeSources() {
  const ordered = targets.map((target) => existing.get(videoKey(target))).filter(Boolean)
  mkdirSync(dirname(sourcesFile), {recursive: true})

  // Written through a temporary file in the same directory and renamed over the
  // target: this runs after every single video, so a run interrupted mid-write
  // would otherwise truncate the committed provenance file.
  const temporaryFile = `${sourcesFile}.${process.pid}.tmp`
  try {
    writeFileSync(temporaryFile, ordered.map((source) => JSON.stringify(source)).join('\n') + '\n', 'utf8')
    renameSync(temporaryFile, sourcesFile)
  } catch (error) {
    rmSync(temporaryFile, {force: true})
    throw error
  }

  return ordered.length
}

for (const [index, target] of selected.entries()) {
  const position = `[${index + 1}/${selected.length}]`

  try {
    const source = await fetchWithRetry(target, (error, wait) => {
      console.log(`${position} ${target.id}  ${error.message} — waiting ${wait / 1000}s`)
    })
    existing.set(videoKey(source), source)
    writeSources()

    consecutiveFailures = 0

    const chunkCount = chunkCues(source.cues).length
    console.log(
      `${position} ${source.id}  ${source.chapters.length} chapters · ${source.cues.length} cues → ${chunkCount} chunks${source.autoGenerated ? ' (auto)' : ''}`,
    )
  } catch (error) {
    // Only a retryable failure counts towards the throttling stop. A video with
    // no captions fails the same way every time, so a run of them says nothing
    // about the endpoint and must not end the run.
    consecutiveFailures = isRetryable(error) ? consecutiveFailures + 1 : 0
    failures.push({id: target.id, url: target.url, reason: error.message})
    console.log(`${position} ${target.id}  FAILED: ${error.message}`)

    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log(
        `\nStopping: ${consecutiveFailures} videos in a row failed — the endpoint is throttling.`,
      )
      console.log('Everything fetched so far is saved. Re-run later to pick up the rest.')
      break
    }
  }

  // Jitter so a long run does not fall into a fixed request rhythm.
  if (index < selected.length - 1) await sleep(DELAY_MS + Math.floor(Math.random() * 1000))
}

// One video without captions must not lose the rest.
const ingestedCount = writeSources()

console.log(`\nwrote ${sourcesFile}`)
console.log(`  ${ingestedCount}/${targets.length} videos have a transcript`)

if (failures.length > 0) {
  console.log(`\n${failures.length} failed:`)
  for (const failure of failures) console.log(`  ${failure.id}  ${failure.reason}`)
  console.log('\nRetry one with: node scripts/ingest/fetch.mjs --only <videoId>')
  process.exitCode = 1
}
