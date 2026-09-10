import 'server-only'

import {createClient} from 'next-sanity'

import {apiVersion, dataset, projectId} from '../env'
import {readToken} from './token'

/**
 * The read-only content client. Server-only: it carries the token for the
 * private dataset, and it can never write (AGENTS.md §5). `useCdn: false`
 * because reads already sit behind Next's cache, so freshness is free.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'published',
  token: readToken,
})
