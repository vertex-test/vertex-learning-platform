import {defineArrayMember, defineField, defineType} from 'sanity'
import {BookIcon} from '@sanity/icons/Book'

type LessonReference = {_key?: string; _ref?: string}
type ModuleValue = {_key?: string; lessons?: LessonReference[]}

/**
 * A lesson must appear at most once in a course. Numbering, prev/next, and the
 * lesson count are all derived from module order (AGENTS.md §8), so a lesson
 * listed twice would silently produce two labels for one page.
 *
 * This lives on the document rather than on `courseModule.lessons` because a
 * field-level `.unique()` cannot see across modules — and cannot see duplicates
 * at all on references, whose distinct `_key`s stop them comparing equal.
 */
function validateUniqueLessons(modules: ModuleValue[] | undefined) {
  const seen = new Set<string>()
  const duplicatePaths: Array<Array<string | {_key: string}>> = []

  for (const module of modules ?? []) {
    for (const lesson of module?.lessons ?? []) {
      const ref = lesson?._ref
      if (!ref) continue

      if (seen.has(ref)) {
        if (module._key && lesson._key) {
          duplicatePaths.push([
            'modules',
            {_key: module._key},
            'lessons',
            {_key: lesson._key},
          ])
        }
      } else {
        seen.add(ref)
      }
    }
  }

  if (duplicatePaths.length === 0) return true

  return {
    message: 'Each lesson can only appear once across a course’s modules.',
    paths: duplicatePaths,
  }
}

export const course = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  icon: BookIcon,
  validation: (rule) =>
    rule.custom((doc) =>
      validateUniqueLessons((doc as {modules?: ModuleValue[]} | undefined)?.modules)
    ),
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'marketing', title: 'Marketing'},
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
      type: 'text',
      rows: 3,
      group: 'marketing',
      validation: (rule) => rule.required().max(280),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      group: 'marketing',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'level',
      title: 'Level',
      type: 'string',
      group: 'marketing',
      options: {
        list: [
          {title: 'Beginner', value: 'beginner'},
          {title: 'Intermediate', value: 'intermediate'},
          {title: 'Advanced', value: 'advanced'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price (USD)',
      description: '0 means the course is free.',
      type: 'number',
      group: 'marketing',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'outcomes',
      title: "What you'll learn",
      type: 'array',
      of: [defineArrayMember({type: 'learningOutcome'})],
      group: 'marketing',
      validation: (rule) => rule.max(6),
    }),
    defineField({
      name: 'instructor',
      title: 'Instructor',
      type: 'reference',
      to: [{type: 'instructor'}],
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'modules',
      title: 'Modules',
      description: 'Ordered. Module numbers are derived from this order.',
      type: 'array',
      of: [defineArrayMember({type: 'courseModule'})],
      group: 'content',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'popular',
      title: 'Popular',
      description: 'Shows the POPULAR badge and sorts the course first.',
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
      title: 'Popular first',
      name: 'popularFirst',
      by: [
        {field: 'popular', direction: 'desc'},
        {field: 'title', direction: 'asc'},
      ],
    },
    {
      title: 'Title, A-Z',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'coverImage',
      level: 'level',
      instructor: 'instructor.name',
    },
    prepare({title, media, level, instructor}) {
      return {
        title,
        media,
        subtitle: [level, instructor].filter(Boolean).join(' · '),
      }
    },
  },
})
