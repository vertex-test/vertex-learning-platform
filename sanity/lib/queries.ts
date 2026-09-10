import {defineQuery} from 'next-sanity'

/**
 * Every query is a `defineQuery` constant with a unique name so TypeGen can
 * pick it up and emit a `*_QUERY_RESULT` type (sanity.types.ts).
 */

const imageFragment = /* groq */ `
  "alt": alt,
  asset->{
    _id,
    url,
    metadata {lqip, dimensions}
  }
`

/** Card-level course fields shared by the catalog and instructor pages. */
const courseCardFragment = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  summary,
  level,
  price,
  popular,
  studentCount,
  coverImage {${imageFragment}},
  "categoryTitle": category->title,
  "instructorName": instructor->name,
  "moduleCount": count(modules),
  "lessonCount": count(modules[].lessons[]),
  "totalDurationSeconds": math::sum(modules[].lessons[]->durationSeconds)
`

/** The catalog listing, popular first. */
export const COURSES_CATALOG_QUERY = defineQuery(/* groq */ `
  *[_type == "course" && defined(slug.current)]
  | order(popular desc, title asc) {
    ${courseCardFragment}
  }
`)

/** Slugs for `generateStaticParams` on the course route. */
export const COURSE_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "course" && defined(slug.current)].slug.current
`)

/** The course detail page, including the full module outline. */
export const COURSE_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "course" && slug.current == $slug][0] {
    ${courseCardFragment},
    outcomes[] {
      _key,
      icon,
      title,
      description
    },
    instructor->{
      _id,
      name,
      "slug": slug.current,
      expertise,
      photo {${imageFragment}}
    },
    category->{
      _id,
      title,
      "slug": slug.current
    },
    modules[] {
      _key,
      title,
      summary,
      lessons[]->{
        _id,
        title,
        "slug": slug.current,
        summary,
        durationSeconds,
        freePreview
      }
    }
  }
`)

/** Slugs for `generateStaticParams` on the lesson route. */
export const LESSON_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "lesson" && defined(slug.current)].slug.current
`)

/** The lesson page itself. */
export const LESSON_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "lesson" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    summary,
    videoUrl,
    durationSeconds,
    freePreview,
    studentCount,
    poster {${imageFragment}},
    notes,
    keyPoints,
    proTip,
    resources[] {
      _key,
      type,
      title,
      description,
      url
    }
  }
`)

/**
 * A lesson stores no parent course (AGENTS.md §8), so the course comes from a
 * reverse reference. The outline feeds the sidebar, the breadcrumbs, the
 * derived "Lesson 5.1" label, and prev/next.
 */
export const LESSON_COURSE_CONTEXT_QUERY = defineQuery(/* groq */ `
  *[_type == "course" && references($lessonId)][0] {
    _id,
    title,
    "slug": slug.current,
    level,
    coverImage {${imageFragment}},
    instructor->{
      _id,
      name,
      "slug": slug.current,
      photo {${imageFragment}}
    },
    modules[] {
      _key,
      title,
      lessons[]->{
        _id,
        title,
        "slug": slug.current,
        durationSeconds,
        freePreview
      }
    }
  }
`)

/** Slugs for `generateStaticParams` on the instructor route. */
export const INSTRUCTOR_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "instructor" && defined(slug.current)].slug.current
`)

/** The instructor page: their profile plus the courses they teach. */
export const INSTRUCTOR_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "instructor" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    expertise,
    bio,
    photo {${imageFragment}},
    "courses": *[_type == "course" && instructor._ref == ^._id]
      | order(popular desc, title asc) {
        ${courseCardFragment}
      }
  }
`)

/** Categories, for catalog filtering. */
export const CATEGORIES_QUERY = defineQuery(/* groq */ `
  *[_type == "category" && defined(slug.current)] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    description
  }
`)
