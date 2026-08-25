export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type ProblemKind =
  | "computational"
  | "proof"
  | "word-problem"
  | "graph-interpretation"
  | "multi-step";

export type AttemptOutcome = "correct" | "incorrect" | "partial" | "skipped";

/** Self-reported on a miss. This is what makes the profile analytics diagnostic
 *  rather than decorative, so it is required whenever an attempt is not correct. */
export type ErrorKind = "conceptual" | "arithmetic" | "setup" | "incomplete";

export type ProblemStatus =
  | "unattempted"
  | "missed"
  | "flagged"
  | "mastered"
  | "in-progress";

export type AnswerFormatKind =
  | "numeric"
  | "expression"
  | "choice"
  | "free-response";

export interface Choice {
  id: string;
  body: string;
}

export interface AnswerFormat {
  kind: AnswerFormatKind;
  /** Present for `numeric`. */
  unit?: string;
  tolerance?: number;
  /** Present for `choice`. */
  choices?: Choice[];
}

export interface Topic {
  id: string;
  name: string;
  strand: string;
}

export interface Textbook {
  id: string;
  title: string;
  authors: string;
  edition?: string;
  problemCount: number;
  solvedCount: number;
  addedAt: string;
}

export interface ProblemSource {
  textbookId: string;
  chapter: string;
  chapterTitle: string;
  problemNumber: string;
}

export interface Problem {
  id: string;
  /** Markdown with inline LaTeX delimited by $ and $$. */
  body: string;
  source: ProblemSource;
  topicId: string;
  subtopic: string;
  tags: string[];
  difficulty: Difficulty;
  kind: ProblemKind;
  answerFormat: AnswerFormat;
  answer: string;
  acceptedAnswers?: string[];
  workedSolution?: string;
  estimatedMinutes: number;
  status: ProblemStatus;
}

/** The shape sent to the browser while a problem is still open. Anything that
 *  names the method is withheld until the student has committed to an answer:
 *  the answer key, our classification, and the section heading, since
 *  "7.4 Partial Fractions" gives the method away as surely as a tag does.
 *  The citation is passed separately as a number-only string. */
export type SolveProblem = Omit<
  Problem,
  | "answer"
  | "acceptedAnswers"
  | "workedSolution"
  | "tags"
  | "subtopic"
  | "source"
>;

export interface Attempt {
  id: string;
  problemId: string;
  outcome: AttemptOutcome;
  errorKind?: ErrorKind;
  submittedAnswer: string;
  seconds: number;
  at: string;
  topicId: string;
  difficulty: Difficulty;
}

export interface QueueSpec {
  textbookIds: string[];
  topicIds: string[];
  kinds: ProblemKind[];
  difficulties: Difficulty[];
  statuses: ProblemStatus[];
  limit: number;
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  course: string;
  joinedAt: string;
}

export interface WeakSpot {
  topicId: string;
  label: string;
  accuracy: number;
  attempted: number;
}

export interface SessionSummary {
  date: string;
  attempted: number;
  correct: number;
  minutes: number;
}

/** Headline numbers for the last 30 days, with the delta measured against the
 *  30 days before that. */
export interface PeriodSummary {
  accuracy: number;
  accuracyDelta: number;
  attempted: number;
  medianSeconds: number;
}

/** A problem as it appears in a list you have not solved yet: the citation and
 *  the body, but none of our classification. Same rule as `SolveProblem`. */
export interface QueuedProblem {
  id: string;
  bodyHtml: string;
  citation: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  status: ProblemStatus;
}

/** A problem you have already answered, so naming it is no longer a spoiler.
 *  Still identified by citation rather than subtopic, since a missed problem
 *  goes straight back into the queue to be retried. */
export interface SolvedItem {
  attemptId: string;
  problemId: string;
  citation: string;
  outcome: AttemptOutcome;
  seconds: number;
  at: string;
}

/** Running totals since the account was created, not windowed like the rest of
 *  the analytics. This is the "how am I doing overall" number. */
export interface LifetimeStats {
  solved: number;
  accuracy: number;
  mastered: number;
}

export interface DashboardData {
  profile: UserProfile;
  streakDays: number;
  lifetime: LifetimeStats;
  summary: PeriodSummary;
  recentAttempts: Attempt[];
  recentSolved: SolvedItem[];
  weakSpots: WeakSpot[];
  sessions: SessionSummary[];
  queuedCount: number;
}

export type AnalyticsRange = "7d" | "30d" | "all";

export interface TrendPoint {
  date: string;
  accuracy: number;
  attempted: number;
}

/** Opacity encodes sample size so a bright cell with two attempts reads as
 *  visibly less certain than one with thirty. */
export interface MasteryCell {
  topicId: string;
  topicName: string;
  difficulty: Difficulty;
  accuracy: number;
  attempted: number;
}

export interface ErrorBreakdownEntry {
  kind: ErrorKind;
  count: number;
}

export interface TimeBucket {
  label: string;
  upperSeconds: number;
  count: number;
}

export interface ReviewItem {
  problemId: string;
  label: string;
  topicName: string;
  difficulty: Difficulty;
  lastMissedAt: string;
  misses: number;
}

export interface AnalyticsData {
  range: AnalyticsRange;
  accuracy: number;
  accuracyDelta: number;
  attempted: number;
  medianSeconds: number;
  streakDays: number;
  trend: TrendPoint[];
  sessions: SessionSummary[];
  mastery: MasteryCell[];
  errorBreakdown: ErrorBreakdownEntry[];
  timeDistribution: TimeBucket[];
  topicAccuracy: WeakSpot[];
  readyToReview: ReviewItem[];
}

export interface ProfileData {
  profile: UserProfile;
  textbooks: Textbook[];
  analytics: AnalyticsData;
}
