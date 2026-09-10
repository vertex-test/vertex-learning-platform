/**
 * Values the UI shows but Sanity never stores (AGENTS.md §8): module and lesson
 * numbers come from array order, and durations and totals are summed from the
 * lessons. Pure functions — safe on the server or in a client component.
 */

export type OutlineLesson = {
  _id: string
  /**
   * Nullable because TypeGen keeps `validation: required()` fields nullable —
   * required is enforced in the Studio, not in the type system.
   */
  title: string | null
  slug: string | null
  durationSeconds: number | null
  freePreview?: boolean | null
}

export type OutlineModule = {
  _key: string
  title: string | null
  summary?: string | null
  lessons: OutlineLesson[] | null
}

export type DerivedLesson<L extends OutlineLesson = OutlineLesson> = L & {
  /** 1-based position inside its module. */
  lessonNumber: number
  /** 1-based position of the module it belongs to. */
  moduleNumber: number
  /** e.g. "Lesson 5.1". */
  label: string
}

export type DerivedModule<
  M extends OutlineModule = OutlineModule,
  L extends OutlineLesson = OutlineLesson,
> = Omit<M, 'lessons'> & {
  /** 1-based position inside the course. */
  moduleNumber: number
  lessons: DerivedLesson<L>[]
  durationSeconds: number
}

export type CourseOutline<
  M extends OutlineModule = OutlineModule,
  L extends OutlineLesson = OutlineLesson,
> = {
  modules: DerivedModule<M, L>[]
  moduleCount: number
  lessonCount: number
  durationSeconds: number
}

/** Numbers every module and lesson, and sums the durations. */
export function courseOutline<
  M extends OutlineModule,
  L extends OutlineLesson = OutlineLesson,
>(modules: M[] | null | undefined): CourseOutline<M, L> {
  const derived = (modules ?? []).map((module, moduleIndex) => {
    const moduleNumber = moduleIndex + 1
    const lessons = ((module.lessons ?? []) as L[]).map(
      (lesson, lessonIndex): DerivedLesson<L> => ({
        ...lesson,
        moduleNumber,
        lessonNumber: lessonIndex + 1,
        label: `Lesson ${moduleNumber}.${lessonIndex + 1}`,
      })
    )

    return {
      ...module,
      moduleNumber,
      lessons,
      durationSeconds: lessons.reduce(
        (total, lesson) => total + (lesson.durationSeconds ?? 0),
        0
      ),
    } as DerivedModule<M, L>
  })

  return {
    modules: derived,
    moduleCount: derived.length,
    lessonCount: derived.reduce(
      (total, module) => total + module.lessons.length,
      0
    ),
    durationSeconds: derived.reduce(
      (total, module) => total + module.durationSeconds,
      0
    ),
  }
}

export type LessonPlacement<
  M extends OutlineModule = OutlineModule,
  L extends OutlineLesson = OutlineLesson,
> = {
  module: DerivedModule<M, L>
  lesson: DerivedLesson<L>
  previous: DerivedLesson<L> | null
  next: DerivedLesson<L> | null
}

/**
 * Locates a lesson in its course outline, with the neighbours the lesson page
 * needs for Previous / Next. Lessons run continuously across module edges.
 */
export function findLesson<M extends OutlineModule, L extends OutlineLesson>(
  outline: CourseOutline<M, L>,
  lessonSlug: string
): LessonPlacement<M, L> | null {
  const flat = outline.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({module, lesson}))
  )
  const index = flat.findIndex((entry) => entry.lesson.slug === lessonSlug)

  if (index === -1) return null

  return {
    module: flat[index].module,
    lesson: flat[index].lesson,
    previous: index > 0 ? flat[index - 1].lesson : null,
    next: index < flat.length - 1 ? flat[index + 1].lesson : null,
  }
}

/** Seconds to the UI's duration string: "45m", "1h 28m", "18h 24m". */
export function formatDuration(seconds: number | null | undefined): string {
  const total = Math.max(0, Math.round(seconds ?? 0))
  // Round to whole minutes *before* splitting, otherwise a value that rounds up
  // to the next hour renders as "1h 60m" (e.g. 7170s) instead of "2h".
  const totalMinutes = Math.round(total / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

/** Seconds to a player timestamp: "12:45", "1:28:00". */
export function formatTimestamp(seconds: number | null | undefined): string {
  const total = Math.max(0, Math.round(seconds ?? 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const pad = (value: number) => String(value).padStart(2, '0')

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(secs)}`
    : `${minutes}:${pad(secs)}`
}

/** Grouped count, e.g. "3,426". */
export function formatCount(count: number | null | undefined): string {
  return (count ?? 0).toLocaleString('en-US')
}

/** Compact count, e.g. "2.1k". */
export function formatCompactCount(count: number | null | undefined): string {
  const value = count ?? 0
  if (value < 1000) return String(value)

  const thousands = value / 1000
  const rounded = thousands < 10 ? Math.round(thousands * 10) / 10 : Math.round(thousands)
  return `${rounded}k`
}

/** The course level as shown in the UI. */
export function formatLevel(level: string | null | undefined): string {
  if (!level) return ''
  return level.charAt(0).toUpperCase() + level.slice(1)
}
