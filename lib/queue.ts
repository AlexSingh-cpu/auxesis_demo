import type {
  Difficulty,
  ProblemKind,
  ProblemStatus,
  QueueSpec,
} from "@/lib/types";

/** What counts as practice: anything not already mastered. */
export const PRACTICE_STATUSES: ProblemStatus[] = [
  "unattempted",
  "missed",
  "flagged",
  "in-progress",
];

export const PROBLEM_KINDS: ProblemKind[] = [
  "computational",
  "multi-step",
  "word-problem",
  "proof",
  "graph-interpretation",
];

export const KIND_LABELS: Record<ProblemKind, string> = {
  computational: "Computational",
  "multi-step": "Multi-step",
  "word-problem": "Word problem",
  proof: "Proof",
  "graph-interpretation": "Graph reading",
};

export const FILTERABLE_STATUSES: ProblemStatus[] = [
  "unattempted",
  "missed",
  "flagged",
  "mastered",
];

export const STATUS_LABELS: Record<ProblemStatus, string> = {
  unattempted: "Not tried",
  missed: "Missed",
  flagged: "Flagged",
  mastered: "Mastered",
  "in-progress": "In progress",
};

/** Short keys, because this spec rides along in the URL for the whole session. */
export const QUEUE_KEYS = {
  book: "book",
  topic: "topic",
  difficulty: "d",
  kind: "kind",
  status: "status",
} as const;

export type SearchParams = Record<string, string | string[] | undefined>;

function values(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  return (Array.isArray(raw) ? raw : [raw])
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function parseQueueSpec(params: SearchParams): Partial<QueueSpec> {
  const difficulties = values(params[QUEUE_KEYS.difficulty])
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 5) as Difficulty[];

  const kinds = values(params[QUEUE_KEYS.kind]).filter((kind) =>
    PROBLEM_KINDS.includes(kind as ProblemKind)
  ) as ProblemKind[];

  const statuses = values(params[QUEUE_KEYS.status]).filter((status) =>
    FILTERABLE_STATUSES.includes(status as ProblemStatus)
  ) as ProblemStatus[];

  return {
    textbookIds: values(params[QUEUE_KEYS.book]),
    topicIds: values(params[QUEUE_KEYS.topic]),
    difficulties,
    kinds,
    // Choosing no status means "anything I have not mastered" rather than
    // "nothing", which is what an empty filter would otherwise mean.
    statuses: statuses.length > 0 ? statuses : PRACTICE_STATUSES,
  };
}

/** Serializes only the queue keys, so unrelated params never leak into links. */
export function queueQuery(params: SearchParams): string {
  const search = new URLSearchParams();
  for (const key of Object.values(QUEUE_KEYS)) {
    const list = values(params[key]);
    if (list.length > 0) search.set(key, list.join(","));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function hasActiveFilters(params: SearchParams): boolean {
  return Object.values(QUEUE_KEYS).some(
    (key) => values(params[key]).length > 0
  );
}

export function solveHref(problemId: string, params: SearchParams) {
  return `/solve/${problemId}${queueQuery(params)}`;
}

/** The dashboard is the queue builder, so finishing a session returns there
 *  with your filters intact rather than dropping them. */
export function dashboardHref(params: SearchParams) {
  return `/dashboard${queueQuery(params)}`;
}
