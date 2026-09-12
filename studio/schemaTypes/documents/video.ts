import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentVideoIcon} from '@sanity/icons/DocumentVideo'

/**
 * Video intelligence: one document per unique video URL (AGENTS.md §8).
 *
 * Built entirely by the offline ingestion pipeline (`scripts/ingest/`, §9), so
 * every field is read-only in the Studio — an author editing this would lose
 * their edit on the next import. Lessons link here by `videoUrl`, not by
 * reference, which is what lets several lessons share one video.
 *
 * This is an internal lookup for search, never a result the learner sees (§7).
 */
export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  icon: DocumentVideoIcon,
  readOnly: true,
  fields: [
    defineField({
      name: 'id',
      title: 'Provider video id',
      description: 'The id the provider knows this video by.',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'Video URL',
      description: 'Matches the `videoUrl` of every lesson that uses this video.',
      type: 'url',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'provider',
      title: 'Provider',
      type: 'string',
      options: {
        list: [
          {title: 'YouTube', value: 'youtube'},
          {title: 'Vimeo', value: 'vimeo'},
          {title: 'Bunny', value: 'bunny'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Source title',
      description: "The provider's own title. Provenance only — the UI shows the lesson's.",
      type: 'string',
    }),
    defineField({
      name: 'chapters',
      title: 'Chapters',
      description:
        "The video's table of contents. Empty when the source has no chapter markers — " +
        'search then falls back to the transcript chunks.',
      type: 'array',
      of: [defineArrayMember({type: 'videoChapter'})],
    }),
    defineField({
      name: 'chunks',
      title: 'Transcript chunks',
      description: 'The transcript, split into short timestamped pieces.',
      type: 'array',
      of: [defineArrayMember({type: 'videoChunk'})],
    }),
  ],
  preview: {
    select: {title: 'title', id: 'id', chapters: 'chapters', chunks: 'chunks'},
    prepare({title, id, chapters, chunks}) {
      const counts = [
        `${chapters?.length ?? 0} chapters`,
        `${chunks?.length ?? 0} chunks`,
      ].join(' · ')

      return {title: title || id, subtitle: counts}
    },
  },
})
