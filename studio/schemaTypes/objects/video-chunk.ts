import {defineField, defineType} from 'sanity'

import {formatTimecode} from './video-chapter'

/**
 * One short, timestamped piece of a transcript (AGENTS.md §8).
 *
 * Deliberately many and small: a query matches a handful of chunks and returns
 * only those. A whole transcript in one field would be returned wholesale and
 * overflow the model's context window (AGENTS.md §12).
 */
export const videoChunk = defineType({
  name: 'videoChunk',
  title: 'Transcript chunk',
  type: 'object',
  fields: [
    defineField({
      name: 'startSeconds',
      title: 'Start (seconds)',
      type: 'number',
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {text: 'text', startSeconds: 'startSeconds'},
    prepare({text, startSeconds}) {
      return {title: text, subtitle: formatTimecode(startSeconds)}
    },
  },
})
