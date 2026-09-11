import {defineField, defineType} from 'sanity'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'

/**
 * One card in a course's "What you'll learn" section. The icon is a curated
 * name the frontend maps to a component, so authors cannot break the design.
 */
export const learningOutcome = defineType({
  name: 'learningOutcome',
  title: 'Learning outcome',
  type: 'object',
  icon: CheckmarkCircleIcon,
  fields: [
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      options: {
        list: [
          {title: 'Layers', value: 'layers'},
          {title: 'Database', value: 'database'},
          {title: 'Gauge', value: 'gauge'},
          {title: 'Cloud', value: 'cloud'},
          {title: 'Shield', value: 'shield'},
          {title: 'Lightning', value: 'zap'},
          {title: 'Branch', value: 'git-branch'},
          {title: 'Terminal', value: 'terminal'},
          {title: 'Code', value: 'code'},
          {title: 'Workflow', value: 'workflow'},
          {title: 'Rocket', value: 'rocket'},
          {title: 'Puzzle', value: 'puzzle'},
          {title: 'Sparkles', value: 'sparkles'},
        ],
      },
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
      validation: (rule) => rule.required().max(160),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'description'},
  },
})
