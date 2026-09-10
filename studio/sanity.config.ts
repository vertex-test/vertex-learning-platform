import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID!
const dataset = process.env.SANITY_STUDIO_DATASET!

export default defineConfig({
  name: 'vertex',
  title: 'Vertex',
  projectId,
  dataset,
  schema: {types: schemaTypes},
  plugins: [structureTool({structure}), visionTool()],
})
