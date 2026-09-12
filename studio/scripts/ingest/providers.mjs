/**
 * Video URL → `{provider, id}`, and the document id derived from it (AGENTS.md §9).
 *
 * This is a deliberate, narrow port of the parsing in `sanity/lib/video.ts`: the
 * Studio is a standalone workspace and cannot import the web workspace's
 * TypeScript. Keep the two in step — this file identifies a video, it never
 * builds an embed, which stays the web side's job.
 */
import {createHash} from 'node:crypto'

/** Sanity accepts `[A-Za-z0-9._-]` in a document id. */
const ID_SAFE = /^[A-Za-z0-9._-]+$/

function hostnameOf(url) {
  return url.hostname.toLowerCase().replace(/^www\./, '')
}

function matchesHost(hostname, host) {
  return hostname === host || hostname.endsWith(`.${host}`)
}

/** `watch?v=ID`, `youtu.be/ID`, `/embed/ID`, `/shorts/ID`. */
function youtubeId(url) {
  if (matchesHost(hostnameOf(url), 'youtu.be')) {
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

/** `vimeo.com/ID` and `player.vimeo.com/video/ID`. The privacy hash is not part of the id. */
function vimeoId(url) {
  const segments = url.pathname.split('/').filter(Boolean)
  const id = segments[segments[0] === 'video' ? 1 : 0]

  return id && /^\d+$/.test(id) ? id : null
}

/** `mediadelivery.net/play|embed/{libraryId}/{videoGuid}`. */
function bunnyId(url) {
  const segments = url.pathname.split('/').filter(Boolean)
  const start = segments[0] === 'play' || segments[0] === 'embed' ? 1 : 0
  const [libraryId, videoId] = segments.slice(start)

  if (!libraryId || !videoId || !/^\d+$/.test(libraryId)) return null

  return `${libraryId}-${videoId}`
}

/**
 * Identifies a video URL. Returns `null` for anything the lesson schema would
 * also reject, so an unparseable URL fails here rather than producing a
 * half-formed document.
 */
export function identifyVideo(videoUrl) {
  let url
  try {
    url = new URL(videoUrl)
  } catch {
    return null
  }

  const hostname = hostnameOf(url)

  if (
    matchesHost(hostname, 'youtube.com') ||
    matchesHost(hostname, 'youtu.be') ||
    matchesHost(hostname, 'youtube-nocookie.com')
  ) {
    const id = youtubeId(url)
    return id ? {provider: 'youtube', id} : null
  }

  if (matchesHost(hostname, 'vimeo.com')) {
    const id = vimeoId(url)
    return id ? {provider: 'vimeo', id} : null
  }

  if (
    matchesHost(hostname, 'mediadelivery.net') ||
    matchesHost(hostname, 'bunnycdn.com') ||
    matchesHost(hostname, 'b-cdn.net')
  ) {
    const id = bunnyId(url)
    return id ? {provider: 'bunny', id} : null
  }

  return null
}

/**
 * `video-<provider>-<id>`, with anything the datastore rejects in an id replaced
 * (AGENTS.md §9). A short hash of the raw id is appended whenever replacing
 * changed something, so two different source ids can never collapse onto one
 * document.
 */
export function videoDocumentId({provider, id}) {
  if (ID_SAFE.test(id)) return `video-${provider}-${id}`

  const safe = id.replace(/[^A-Za-z0-9._-]/g, '-')
  const digest = createHash('sha1').update(id).digest('hex').slice(0, 8)

  return `video-${provider}-${safe}-${digest}`
}
