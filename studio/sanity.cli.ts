import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
  },
  /**
   * The deployed Studio application at vertex-xxdqhkai.sanity.studio. Pinned so
   * a redeploy never prompts for the application, and because the Context MCP
   * only serves a dataset that has one (AGENTS.md §12).
   */
  deployment: {
    appId: 'erj7wryc4ph1zgb0pq6k0jgc',
  },
  /**
   * TypeGen reads the queries in the web workspace (the repo root) and writes
   * the generated types next to them. Regenerates during `sanity dev`/`build`.
   */
  typegen: {
    enabled: true,
    path: '../{app,sanity}/**/*.{ts,tsx}',
    schema: 'schema.json',
    generates: '../sanity.types.ts',
    overloadClientMethods: true,
  },
})
