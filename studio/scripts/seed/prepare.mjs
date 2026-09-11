/**
 * Maps the authored seed files onto the committed schema and writes the ndjson
 * that `sanity dataset import` consumes.
 *
 * `seed.ndjson` and `videos.json` are read-only inputs: this script never writes
 * back to them. The mapping is mechanical — field and object-type renames plus a
 * lesson summary lifted from the lesson's own first notes paragraph. No copy is
 * invented here; anything missing from the seed stays missing.
 *
 *   node scripts/seed/prepare.mjs [outFile]
 */
import {createHash} from 'node:crypto'
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const seedDir = dirname(fileURLToPath(import.meta.url))
const seedFile = join(seedDir, 'seed.ndjson')
const videosFile = join(seedDir, 'videos.json')
const outFile = resolve(process.argv[2] ?? join(seedDir, '.out', 'import.ndjson'))

/** The plain text of a Portable Text block, used for the lesson summary. */
function blockText(block) {
  return (block?.children ?? [])
    .filter((child) => child._type === 'span')
    .map((child) => child.text)
    .join('')
    .trim()
}

function mapLesson(doc) {
  const {thumbnail, duration, resources, notes, ...rest} = doc
  const summary = blockText(notes?.[0])
  if (!summary) throw new Error(`${doc._id}: no notes intro to take the summary from`)
  if (summary.length > 200) throw new Error(`${doc._id}: summary is ${summary.length} chars`)
  return {
    ...rest,
    summary,
    notes,
    poster: thumbnail,
    durationSeconds: duration,
    resources: resources?.map((resource) => ({...resource, _type: 'lessonResource'})),
  }
}

function mapCourse(doc) {
  const {learningOutcomes, modules, ...rest} = doc
  return {
    ...rest,
    outcomes: learningOutcomes,
    modules: modules?.map((module) => ({...module, _type: 'courseModule'})),
  }
}

const seed = readFileSync(seedFile, 'utf8')
  .split('\n')
  .filter((line) => line.trim())
  .map((line) => JSON.parse(line))

// videos.json is the provenance map for the lessons' videos. Nothing is imported
// from it — the §9 ingestion pipeline owns that — but a mismatch means the two
// files have drifted apart, and the import should stop rather than seed a lesson
// pointing at a video the map does not describe.
const videos = JSON.parse(readFileSync(videosFile, 'utf8'))
const lessons = seed.filter((doc) => doc._type === 'lesson')
for (const lesson of lessons) {
  const slug = lesson.slug?.current
  const video = videos[slug]
  if (!video) throw new Error(`${lesson._id}: no videos.json entry for "${slug}"`)
  if (lesson.videoUrl !== `https://www.youtube.com/watch?v=${video.id}`) {
    throw new Error(`${lesson._id}: videoUrl does not match videos.json id ${video.id}`)
  }
  if (lesson.duration !== video.duration) {
    throw new Error(`${lesson._id}: duration ${lesson.duration} != videos.json ${video.duration}`)
  }
}
const unused = Object.keys(videos).filter(
  (slug) => !lessons.some((lesson) => lesson.slug?.current === slug),
)
if (unused.length) throw new Error(`videos.json entries with no lesson: ${unused.join(', ')}`)

const mapped = seed.map((doc) => {
  if (doc._type === 'lesson') return mapLesson(doc)
  if (doc._type === 'course') return mapCourse(doc)
  return doc
})

const ndjson = mapped.map((doc) => JSON.stringify(doc)).join('\n') + '\n'
mkdirSync(dirname(outFile), {recursive: true})
writeFileSync(outFile, ndjson)

const counts = mapped.reduce((acc, doc) => ({...acc, [doc._type]: (acc[doc._type] ?? 0) + 1}), {})
console.log(`seed.ndjson  ${createHash('md5').update(readFileSync(seedFile)).digest('hex')}`)
console.log(`videos.json  ${createHash('md5').update(readFileSync(videosFile)).digest('hex')}`)
console.log(`wrote ${outFile}`)
console.log(
  Object.entries(counts)
    .sort()
    .map(([type, count]) => `  ${count} ${type}`)
    .join('\n'),
)
