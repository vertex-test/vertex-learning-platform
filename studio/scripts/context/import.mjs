/**
 * Imports the Sanity Context configuration document (AGENTS.md §10).
 *
 * Same shape as scripts/seed/import.mjs: `sanity dataset import` does not read
 * the dataset from the environment the way `sanity dev` does, so the name comes
 * from SANITY_STUDIO_DATASET or the workspace's .env.local.
 *
 * `--replace` upserts by `_id`, so re-running this is how the instructions are
 * edited. Edits reach the agent on its next request; changes to the web app's
 * inline system prompt still need a server restart (AGENTS.md §10).
 *
 *   node scripts/context/import.mjs [extra sanity flags]
 */
import {execFileSync} from 'node:child_process'
import {existsSync, readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const contextDir = dirname(fileURLToPath(import.meta.url))
const studioDir = join(contextDir, '..', '..')

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

const importFile = join(contextDir, '.out', 'context.ndjson')
const run = (args) => execFileSync('node', args, {cwd: studioDir, stdio: 'inherit'})

run([join(contextDir, 'prepare.mjs')])
console.log(`\nimporting the Context document into dataset "${dataset}"\n`)
run([
  join(studioDir, 'node_modules', 'sanity', 'bin', 'sanity'),
  ...['dataset', 'import', importFile, dataset, '--replace', ...process.argv.slice(2)],
])
