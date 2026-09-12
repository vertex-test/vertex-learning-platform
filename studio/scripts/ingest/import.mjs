/**
 * Prepares the video documents and imports them into the configured dataset.
 *
 * Same shape as `scripts/seed/import.mjs`: the dataset comes from
 * SANITY_STUDIO_DATASET or the workspace's .env.local, never a hardcoded name,
 * and `--replace` upserts rather than snapshots — nothing is ever deleted.
 *
 *   node scripts/ingest/import.mjs [--allow-partial] [extra sanity flags]
 */
import {execFileSync} from 'node:child_process'
import {existsSync, readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const ingestDir = dirname(fileURLToPath(import.meta.url))
const studioDir = join(ingestDir, '..', '..')

function datasetFromEnvFile() {
  for (const file of ['.env.local', '.env']) {
    const path = join(studioDir, file)
    if (!existsSync(path)) continue
    const match = readFileSync(path, 'utf8').match(/^SANITY_STUDIO_DATASET=(.+)$/m)
    if (match) return match[1].trim().replace(/^["']|["']$/g, '')
  }
  return undefined
}

const dataset = process.env.SANITY_STUDIO_DATASET || datasetFromEnvFile()
if (!dataset) {
  console.error('No dataset: set SANITY_STUDIO_DATASET in studio/.env.local')
  process.exit(1)
}

const importFile = join(ingestDir, '.out', 'videos.ndjson')
const run = (args) => execFileSync('node', args, {cwd: studioDir, stdio: 'inherit'})

// `--allow-partial` belongs to prepare; everything else is passed through to the
// sanity CLI.
const passthrough = process.argv.slice(2).filter((arg) => arg !== '--allow-partial')
const prepareArgs = process.argv.includes('--allow-partial') ? ['--allow-partial'] : []

run([join(ingestDir, 'prepare.mjs'), ...prepareArgs])
console.log(`\nimporting into dataset "${dataset}"\n`)
run([
  join(studioDir, 'node_modules', 'sanity', 'bin', 'sanity'),
  ...['dataset', 'import', importFile, dataset, '--replace', ...passthrough],
])
