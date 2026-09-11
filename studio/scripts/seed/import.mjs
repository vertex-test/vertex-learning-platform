/**
 * Prepares the import file and runs `sanity dataset import` against the dataset
 * the workspace is configured for.
 *
 * `sanity dataset import` does not resolve the dataset from the environment the
 * way `sanity dev` does, so the name is read here — from SANITY_STUDIO_DATASET,
 * else from the workspace's .env.local — rather than hardcoded in a script.
 *
 *   node scripts/seed/import.mjs [extra sanity flags]
 */
import {execFileSync} from 'node:child_process'
import {existsSync, readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const seedDir = dirname(fileURLToPath(import.meta.url))
const studioDir = join(seedDir, '..', '..')

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

const importFile = join(seedDir, '.out', 'import.ndjson')
const run = (args) => execFileSync('node', args, {cwd: studioDir, stdio: 'inherit'})

run([join(seedDir, 'prepare.mjs')])
console.log(`\nimporting into dataset "${dataset}"\n`)
run([
  join(studioDir, 'node_modules', 'sanity', 'bin', 'sanity'),
  ...['dataset', 'import', importFile, dataset, '--replace', ...process.argv.slice(2)],
])
