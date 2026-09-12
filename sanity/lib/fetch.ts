import 'server-only'

import {client} from './client'

/** GROQ parameter values Vertex actually passes. */
export type SanityQueryParams = Record<
  string,
  string | number | boolean | null | readonly string[]
>

type SanityFetchOptions<Q extends string> = {
  query: Q
  params?: SanityQueryParams
  /**
   * Cache tags for on-demand revalidation. Next.js 16 does not cache `fetch`
   * by default, so a request without `revalidate` or `tags` is always fresh.
   */
  tags?: string[]
  /** Seconds. `false` caches until a tag revalidates. */
  revalidate?: number | false
}

/**
 * The single read path for page data (AGENTS.md §5). Server-only, and the
 * return type comes straight from TypeGen when `query` is a `defineQuery`
 * constant.
 */
export async function sanityFetch<const Q extends string>({
  query,
  params = {},
  tags = [],
  revalidate = 60,
}: SanityFetchOptions<Q>) {
  return client.fetch(query, params, {
    next: {
      revalidate: tags.length ? false : revalidate,
      tags,
    },
  })
}
