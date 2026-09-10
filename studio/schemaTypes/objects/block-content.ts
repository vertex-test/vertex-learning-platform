import {defineArrayMember, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'

/**
 * Portable Text used for lesson notes and instructor bios. Vertex stores rich
 * text structurally, never as markdown (AGENTS.md §7).
 */
export const blockContent = defineType({
  name: 'blockContent',
  title: 'Rich text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Heading', value: 'h2'},
        {title: 'Subheading', value: 'h3'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Code', value: 'code'},
        ],
        annotations: [
          defineArrayMember({
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [
              {
                name: 'href',
                title: 'URL',
                type: 'url',
                validation: (rule) =>
                  rule.required().uri({scheme: ['http', 'https', 'mailto']}),
              },
            ],
          }),
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      icon: ImageIcon,
      options: {hotspot: true},
      fields: [
        {
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          validation: (rule) => rule.required(),
        },
        {name: 'caption', title: 'Caption', type: 'string'},
      ],
    }),
  ],
})
