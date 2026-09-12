import {defineField, defineType} from 'sanity'

/**
 * One entry of a video's table of contents (AGENTS.md §8).
 *
 * Chapter labels are the clean, human-written layer that search matches first;
 * the transcript chunks are the noisier fallback (AGENTS.md §7). Written by the
 * ingestion pipeline, never by hand.
 */
export const videoChapter = defineType({
  name: 'videoChapter',
  title: 'Chapter',
  type: 'object',
  fields: [
    defineField({
      name: 'startSeconds',
      title: 'Start (seconds)',
      type: 'number',
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'label', startSeconds: 'startSeconds'},
    prepare({title, startSeconds}) {
      return {title, subtitle: formatTimecode(startSeconds)}
    },
  },
})

/** `615` → `10:15`. Preview only — the app derives its own display strings. */
export function formatTimecode(seconds: unknown): string {
  const total = typeof seconds === 'number' && Number.isFinite(seconds) ? Math.floor(seconds) : 0
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const pad = (value: number) => String(value).padStart(2, '0')

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`
}
