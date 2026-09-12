import { z } from "zod";

/**
 * The contract between the search agent, the search route, and the results page.
 *
 * Deliberately free of server-only imports: the client component reads these
 * types, so nothing here may drag a Sanity client or a token across the
 * boundary (AGENTS.md §5).
 */

/** A query the route will accept. Capped before it ever reaches the model. */
export const searchRequestSchema = z.object({
  query: z.string().trim().min(2).max(200),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

/**
 * What the model is allowed to decide: which lessons matched, in what order,
 * and on what evidence. It never writes the card copy — every field the learner
 * reads is looked up from Sanity afterwards (AGENTS.md §7, §11), which is what
 * makes "never invent a course, lesson, or duration" structural rather than
 * a hope.
 */
export const agentMatchSchema = z.object({
  lessonId: z
    .string()
    .describe("The lesson document's _id, exactly as returned by GROQ."),
  matchedOn: z
    .enum(["title", "keyPoints", "notes", "course"])
    .describe("Where the match was found. Drives nothing but ranking review."),
});

export const agentResultsSchema = z.object({
  matches: z
    .array(agentMatchSchema)
    .describe(
      "Every relevant lesson, best match first. Do not cap this to a handful.",
    ),
  reply: z
    .string()
    .max(280)
    .describe(
      "One plain sentence about what was found. No lesson titles, no counts, no invented facts.",
    ),
});

export type AgentResults = z.infer<typeof agentResultsSchema>;

/** A lesson result card, built entirely from stored Sanity fields. */
export type LessonSearchResult = {
  kind: "lesson";
  lessonId: string;
  slug: string;
  title: string;
  summary: string | null;
  keyPoints: string[];
  durationSeconds: number | null;
  courseTitle: string | null;
  courseSlug: string | null;
  courseCoverAssetId: string | null;
  courseCoverAlt: string | null;
  courseCoverLqip: string | null;
  /** Derived from array order, never stored (AGENTS.md §8). */
  moduleNumber: number | null;
  moduleTitle: string | null;
  lessonLabel: string | null;
};

export type SearchResult = LessonSearchResult;

/** The sort control on the results page. Re-sorts in place; never refetches. */
export const SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "shortest", label: "Shortest First" },
  { value: "longest", label: "Longest First" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export function isSortOption(value: string): value is SortOption {
  return SORT_OPTIONS.some((option) => option.value === value);
}

/**
 * The NDJSON the route streams. One event per line: `status` while the agent is
 * still querying, then exactly one terminal `results` or `error`.
 */
export type SearchStreamEvent =
  | { type: "status"; message: string }
  | {
      type: "results";
      query: string;
      results: SearchResult[];
      resultCount: number;
      courseCount: number;
      reply: string | null;
    }
  | { type: "error"; message: string };
