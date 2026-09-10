import {defineArrayMember, defineField, defineType} from 'sanity'
import {FolderIcon} from '@sanity/icons/Folder'

/**
 * A module is embedded in its course, not a document of its own (AGENTS.md §8).
 * Its number ("Module 5") comes from array order and is never stored.
 */
export const courseModule = defineType({
  name: 'courseModule',
  title: 'Module',
  type: 'object',
  icon: FolderIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required().max(200),
    }),
    defineField({
      name: 'lessons',
      title: 'Lessons',
      description: 'Ordered. Lesson numbers are derived from this order.',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'lesson'}]})],
      // No `.unique()` here: array members of type reference each carry their
      // own `_key`, so they never compare equal and the check never fires.
      // Duplicates are caught course-wide by the `course` document validation,
      // which compares the underlying `_ref` values across every module.
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {title: 'title', lessons: 'lessons'},
    prepare({title, lessons}) {
      const count = Array.isArray(lessons) ? lessons.length : 0
      return {
        title,
        subtitle: `${count} ${count === 1 ? 'lesson' : 'lessons'}`,
      }
    },
  },
})
