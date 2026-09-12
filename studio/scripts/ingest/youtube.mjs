/**
 * YouTube ingestion: captions and chapter markers for one video (AGENTS.md §9).
 *
 * Uses YouTube's own InnerTube endpoints over plain `fetch` — no API key, no
 * external binary, no dependency. They are unofficial and can change, which is
 * exactly why `fetch.mjs` writes its result to a committed source file: the
 * transcripts survive the endpoint.
 *
 * Returns the *normalised source* shape, not Sanity documents. Turning cues into
 * chunks is `chunk.mjs`'s job, and it stays pure so the transform can be re-run
 * offline.
 */

const INNERTUBE = 'https://www.youtube.com/youtubei/v1'

/** The Android client returns caption tracks without needing a player signature. */
const PLAYER_CONTEXT = {
  client: {
    clientName: 'ANDROID',
    clientVersion: '20.10.38',
    androidSdkVersion: 30,
    hl: 'en',
  },
}

/** Chapter markers only ride along on the web client's `next` response. */
const NEXT_CONTEXT = {
  client: {clientName: 'WEB', clientVersion: '2.20250101.00.00', hl: 'en'},
}

const USER_AGENT = 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip'

async function innertube(endpoint, context, videoId) {
  const response = await fetch(`${INNERTUBE}/${endpoint}`, {
    method: 'POST',
    headers: {'content-type': 'application/json', 'user-agent': USER_AGENT},
    body: JSON.stringify({context, videoId}),
  })

  if (!response.ok) throw new Error(`${endpoint} responded ${response.status}`)

  return response.json()
}

/** Prefers a real English track over an auto-generated one, then any English, then anything. */
function pickCaptionTrack(tracks) {
  const english = tracks.filter((track) => (track.languageCode ?? '').startsWith('en'))
  const pool = english.length > 0 ? english : tracks

  return pool.find((track) => track.kind !== 'asr') ?? pool[0] ?? null
}

/**
 * json3 cues. Auto-generated tracks emit rolling-window events whose only
 * content is a newline append — those carry no new words and are dropped.
 */
function cuesFromJson3(payload) {
  const cues = []

  for (const event of payload.events ?? []) {
    if (!Array.isArray(event.segs)) continue
    if (event.aAppend === 1) continue

    const text = event.segs
      .map((segment) => segment.utf8 ?? '')
      .join('')
      .replace(/\s+/g, ' ')
      .trim()

    if (!text) continue

    cues.push({startSeconds: Math.max(0, Math.floor((event.tStartMs ?? 0) / 1000)), text})
  }

  return cues
}

/**
 * Chapters live under `markersMap`, keyed by where they came from: the author's
 * description beats YouTube's auto-generated guess. Falls back to a recursive
 * sweep for `chapterRenderer` so a moved path degrades to "no chapters" rather
 * than a crash.
 */
function chaptersFromNext(payload) {
  const markerMaps = []
  const renderers = []

  const walk = (node) => {
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (!node || typeof node !== 'object') return

    if (Array.isArray(node.markersMap)) markerMaps.push(...node.markersMap)
    if (node.chapterRenderer) renderers.push(node.chapterRenderer)

    Object.values(node).forEach(walk)
  }
  walk(payload)

  const preferred =
    markerMaps.find((entry) => entry.key === 'DESCRIPTION_CHAPTERS') ??
    markerMaps.find((entry) => entry.key === 'AUTO_CHAPTERS')

  const source = preferred?.value?.chapters
    ? preferred.value.chapters.map((chapter) => chapter.chapterRenderer).filter(Boolean)
    : renderers

  const byStart = new Map()
  for (const chapter of source) {
    const label = (chapter?.title?.simpleText ?? chapter?.title?.runs?.[0]?.text ?? '').trim()
    const startSeconds = Math.max(0, Math.floor((chapter?.timeRangeStartMillis ?? 0) / 1000))

    if (!label) continue
    if (!byStart.has(startSeconds)) byStart.set(startSeconds, {startSeconds, label})
  }

  return [...byStart.values()].sort((a, b) => a.startSeconds - b.startSeconds)
}

/**
 * Fetches one video's captions and chapters.
 *
 * Throws when the video cannot be ingested at all (unplayable, or no captions);
 * a video with no chapters is not an error — §7's transcript fallback covers it.
 */
export async function fetchYouTubeSource({id, url}) {
  const player = await innertube('player', PLAYER_CONTEXT, id)

  const status = player.playabilityStatus?.status
  if (status && status !== 'OK') {
    throw new Error(`unplayable (${status}${player.playabilityStatus?.reason ? `: ${player.playabilityStatus.reason}` : ''})`)
  }

  const tracks = player.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
  const track = pickCaptionTrack(tracks)
  if (!track?.baseUrl) throw new Error('no caption track')

  const captionUrl = new URL(track.baseUrl)
  captionUrl.searchParams.set('fmt', 'json3')

  const captions = await fetch(captionUrl)
  if (!captions.ok) throw new Error(`captions responded ${captions.status}`)

  const cues = cuesFromJson3(await captions.json())
  if (cues.length === 0) throw new Error('caption track is empty')

  // `next` is only for chapters: a failure there must not lose the transcript.
  let chapters = []
  try {
    chapters = chaptersFromNext(await innertube('next', NEXT_CONTEXT, id))
  } catch {
    chapters = []
  }

  return {
    provider: 'youtube',
    id,
    url,
    title: player.videoDetails?.title ?? null,
    durationSeconds: Number.parseInt(player.videoDetails?.lengthSeconds ?? '', 10) || null,
    language: track.languageCode ?? null,
    autoGenerated: track.kind === 'asr',
    chapters,
    cues,
  }
}
