import {defineArrayMember, defineField, defineType} from 'sanity'
import {PlayIcon} from '@sanity/icons/Play'

/**
 * Only providers Vertex can both ingest and play back are accepted
 * (AGENTS.md §9). Bunny is included under its delivery hostnames as well as
 * pull-zone CDN domains.
 */
const SUPPORTED_VIDEO_HOSTS = [
  // YouTube
  'youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  // Vimeo
  'vimeo.com',
  // Bunny
  'mediadelivery.net',
  'bunnycdn.com',
  'b-cdn.net',
]

function isSupportedVideoUrl(url: string): boolean {
  let hostname: string
  try {
    hostname = new URL(url).hostname.toLowerCase()
  } catch {
    return false
  }

  return SUPPORTED_VIDEO_HOSTS.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`)
  )
}

/**
 * A lesson does not store its parent course (AGENTS.md §8) — the course is
 * derived with a reverse reference, which is what keeps a lesson reusable and
 * the module ordering single-sourced on the course.
 */
export const lesson = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  icon: PlayIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'video', title: 'Video'},
    {name: 'meta', title: 'Meta'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      description: 'The one-line description under the lesson title.',
      type: 'text',
      rows: 2,
      group: 'content',
      validation: (rule) => rule.required().max(200),
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      description:
        'A YouTube, Vimeo, or Bunny URL. Played on the lesson page as a provider embed.',
      type: 'url',
      group: 'video',
      validation: (rule) =>
        rule
          .required()
          .uri({scheme: ['http', 'https']})
          .custom((value) => {
            // `required()` already reports an empty value; don't double-report.
            if (typeof value !== 'string' || value === '') return true

            return (
              isSupportedVideoUrl(value) ||
              'Only YouTube, Vimeo, and Bunny videos are supported.'
            )
          }),
    }),
    defineField({
      name: 'poster',
      title: 'Poster image',
      type: 'image',
      group: 'video',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'durationSeconds',
      title: 'Duration (seconds)',
      description:
        'Stored in seconds so course and module totals can be summed. The UI formats it.',
      type: 'number',
      group: 'video',
      validation: (rule) => rule.required().integer().positive(),
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      description: 'The lesson overview and written content.',
      type: 'blockContent',
      group: 'content',
    }),
    defineField({
      name: 'keyPoints',
      title: 'Key points',
      description: 'The "In this lesson you will:" list.',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      group: 'content',
      validation: (rule) => rule.max(6).unique(),
    }),
    defineField({
      name: 'proTip',
      title: 'Pro tip',
      type: 'text',
      rows: 3,
      group: 'content',
      validation: (rule) => rule.max(280),
    }),
    defineField({
      name: 'resources',
      title: 'Resources',
      type: 'array',
      of: [defineArrayMember({type: 'lessonResource'})],
      group: 'content',
    }),
    defineField({
      name: 'freePreview',
      title: 'Free preview',
      description: 'A label on the lesson, not access control (AGENTS.md §7).',
      type: 'boolean',
      group: 'meta',
      initialValue: false,
    }),
    defineField({
      name: 'studentCount',
      title: 'Student count',
      description: 'Display only.',
      type: 'number',
      group: 'meta',
      validation: (rule) => rule.integer().min(0),
    }),
  ],
  orderings: [
    {
      title: 'Title, A-Z',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
  preview: {
    select: {title: 'title', subtitle: 'summary', media: 'poster'},
  },
})
