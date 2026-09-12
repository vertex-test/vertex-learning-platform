/**
 * Provider video URL → embed URL (AGENTS.md §9).
 *
 * Pure and dependency-free so the client player can import it: it carries no
 * Sanity client and no token across the boundary (AGENTS.md §5).
 *
 * Only the three providers the lesson schema validates are supported, and a
 * provider counts as supported only where playback and seek both exist. An
 * unrecognised URL returns `null` rather than a guessed embed — the player
 * shows the poster instead of an empty frame.
 */

export type VideoProvider = 'youtube' | 'vimeo' | 'bunny'

export type VideoEmbed = {
  provider: VideoProvider
  /** The `src` for the player iframe, already carrying the start second. */
  src: string
  /** Iframe title, for screen readers. */
  title: string
}

/** A `?t=` value is untrusted: finite, non-negative whole seconds or nothing. */
export function parseStartSeconds(
  value: string | null | undefined,
  durationSeconds?: number | null
): number {
  if (typeof value !== 'string' || value.trim() === '') return 0

  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0

  // Clamp to the lesson's own length so a bogus deep link cannot push the
  // player past the end of the video.
  const max = durationSeconds ?? null
  if (max != null && max > 0) return Math.min(parsed, Math.floor(max))

  return parsed
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

function matchesHost(hostname: string, host: string): boolean {
  return hostname === host || hostname.endsWith(`.${host}`)
}

/** `watch?v=ID`, `youtu.be/ID`, `/embed/ID` and `/shorts/ID`. */
function youtubeId(url: URL): string | null {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, '')

  if (matchesHost(hostname, 'youtu.be')) {
    return url.pathname.slice(1).split('/')[0] || null
  }

  const fromQuery = url.searchParams.get('v')
  if (fromQuery) return fromQuery

  const segments = url.pathname.split('/').filter(Boolean)
  if (segments[0] === 'embed' || segments[0] === 'shorts' || segments[0] === 'v') {
    return segments[1] ?? null
  }

  return null
}

/** `vimeo.com/ID` and `player.vimeo.com/video/ID`, with an optional hash. */
function vimeoId(url: URL): {id: string; hash: string | null} | null {
  const segments = url.pathname.split('/').filter(Boolean)
  const index = segments[0] === 'video' ? 1 : 0
  const id = segments[index]

  if (!id || !/^\d+$/.test(id)) return null

  // Unlisted Vimeo videos carry a privacy hash as the next segment.
  const next = segments[index + 1]
  return {id, hash: next && /^[0-9a-z]+$/i.test(next) ? next : null}
}

/** `mediadelivery.net/play|embed/{libraryId}/{videoGuid}`. */
function bunnyIds(url: URL): {libraryId: string; videoId: string} | null {
  const segments = url.pathname.split('/').filter(Boolean)
  const start = segments[0] === 'play' || segments[0] === 'embed' ? 1 : 0
  const [libraryId, videoId] = segments.slice(start)

  if (!libraryId || !videoId) return null
  if (!/^\d+$/.test(libraryId)) return null

  return {libraryId, videoId}
}

/**
 * Builds the embed that plays the lesson on Vertex itself, starting at
 * `startSeconds`. The learner is never sent out to the provider (AGENTS.md §7).
 *
 * `autoplay` is on because the player only mounts the iframe after the learner
 * has clicked play — it continues that gesture rather than starting unprompted.
 */
export function videoEmbed(
  videoUrl: string | null | undefined,
  {
    startSeconds = 0,
    title = 'Lesson video',
    autoplay = true,
  }: {startSeconds?: number; title?: string; autoplay?: boolean} = {}
): VideoEmbed | null {
  if (!videoUrl) return null

  let url: URL
  try {
    url = new URL(videoUrl)
  } catch {
    return null
  }

  const hostname = hostnameOf(videoUrl)
  if (!hostname) return null

  const start = Number.isFinite(startSeconds) && startSeconds > 0 ? Math.floor(startSeconds) : 0

  if (
    matchesHost(hostname, 'youtube.com') ||
    matchesHost(hostname, 'youtu.be') ||
    matchesHost(hostname, 'youtube-nocookie.com')
  ) {
    const id = youtubeId(url)
    if (!id) return null

    // -nocookie so a lesson view does not set YouTube's tracking cookies.
    const params = new URLSearchParams({rel: '0', modestbranding: '1'})
    if (autoplay) params.set('autoplay', '1')
    if (start > 0) params.set('start', String(start))

    return {
      provider: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params}`,
      title,
    }
  }

  if (matchesHost(hostname, 'vimeo.com')) {
    const parsed = vimeoId(url)
    if (!parsed) return null

    const params = new URLSearchParams()
    if (parsed.hash) params.set('h', parsed.hash)
    if (autoplay) params.set('autoplay', '1')

    // Vimeo seeks via the fragment, not a query parameter.
    const fragment = start > 0 ? `#t=${start}s` : ''
    const query = params.toString()

    return {
      provider: 'vimeo',
      src: `https://player.vimeo.com/video/${parsed.id}${query ? `?${query}` : ''}${fragment}`,
      title,
    }
  }

  if (
    matchesHost(hostname, 'mediadelivery.net') ||
    matchesHost(hostname, 'bunnycdn.com') ||
    matchesHost(hostname, 'b-cdn.net')
  ) {
    const parsed = bunnyIds(url)
    if (!parsed) return null

    const params = new URLSearchParams({preload: 'true', responsive: 'true'})
    if (autoplay) params.set('autoplay', 'true')
    if (start > 0) params.set('t', String(start))

    return {
      provider: 'bunny',
      src: `https://iframe.mediadelivery.net/embed/${parsed.libraryId}/${encodeURIComponent(parsed.videoId)}?${params}`,
      title,
    }
  }

  return null
}
