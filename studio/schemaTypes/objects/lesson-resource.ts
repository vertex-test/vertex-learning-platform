import {defineField, defineType} from 'sanity'
import {LinkIcon} from '@sanity/icons/Link'

/** One card in a lesson's Resources row. */
export const lessonResource = defineType({
  name: 'lessonResource',
  title: 'Resource',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Documentation', value: 'documentation'},
          {title: 'Article', value: 'article'},
          {title: 'Code repository', value: 'code'},
          {title: 'Download', value: 'download'},
          {title: 'Video', value: 'video'},
          {title: 'Link', value: 'link'},
        ],
      },
      initialValue: 'documentation',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'type'},
  },
})
