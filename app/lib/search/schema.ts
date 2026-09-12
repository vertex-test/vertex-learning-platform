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
  kind: z
    .enum(["lesson", "video"])
    .describe(
      'Use "video" when a specific moment inside the video matched, and "lesson" when the lesson matched on its own topic.',
    ),
  startSeconds: z
    .number()
    .int()
    .min(0)
    .describe(
      "For a video match, the startSeconds of the matched chapter or transcript chunk, copied exactly from the data. Use 0 for a lesson match.",
    ),
  matchedOn: z
    .enum(["title", "keyPoints", "notes", "course", "chapter", "transcript"])
    .describe("Where the match was found. Drives nothing but ranking review."),
});

export const agentResultsSchema = z.object({
  matches: z
    .array(agentMatchSchema)
    .describe(
      "Every relevant match, best first: lessons and video moments in one ranked list. Do not cap this to a handful.",
    ),
  reply: z
    .string()
    .max(280)
    .describe(
      "One plain sentence about what was found. No lesson titles, no counts, no invented facts.",
    ),
});

export type AgentResults = z.infer<typeof agentResultsSchema>;

/** Fields every result card shows, all of them stored Sanity content. */
type ResultBase = {
  lessonId: string;
  slug: string;
  title: string;
  summary: string | null;
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

/** A lesson result card, built entirely from stored Sanity fields. */
export type LessonSearchResult = ResultBase & {
  kind: "lesson";
  keyPoints: string[];
};

/**
 * A video moment: a lesson's video matched at one second (AGENTS.md §11).
 *
 * `startSeconds` is never the model's own number — hydration only keeps a
 * second that exists in the `video` document, so a card can never point at an
 * invented moment. `title` is the matched chapter's label when the match came
 * from the table of contents, and the lesson's title when it came from the
 * transcript (§7).
 */
export type VideoSearchResult = ResultBase & {
  kind: "video";
  startSeconds: number;
  matchedFrom: "chapter" | "transcript";
  posterAssetId: string | null;
  posterAlt: string | null;
  posterLqip: string | null;
};

export type SearchResult = LessonSearchResult | VideoSearchResult;

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
