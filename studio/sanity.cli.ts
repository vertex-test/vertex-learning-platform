import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
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
