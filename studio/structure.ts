import type {StructureResolver} from 'sanity/structure'
import {BookIcon} from '@sanity/icons/Book'
import {DocumentVideoIcon} from '@sanity/icons/DocumentVideo'
import {PlayIcon} from '@sanity/icons/Play'
import {TagIcon} from '@sanity/icons/Tag'
import {UserIcon} from '@sanity/icons/User'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('course').title('Courses').icon(BookIcon),
      S.documentTypeListItem('lesson').title('Lessons').icon(PlayIcon),
      S.divider(),
      S.documentTypeListItem('instructor').title('Instructors').icon(UserIcon),
      S.documentTypeListItem('category').title('Categories').icon(TagIcon),
      S.divider(),
      // Built by the offline ingestion pipeline (AGENTS.md §9) and read-only —
      // listed so it can be inspected, not authored.
      S.documentTypeListItem('video').title('Video intelligence').icon(DocumentVideoIcon),
    ])
