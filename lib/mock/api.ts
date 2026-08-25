import type {
  AnalyticsData,
  AnalyticsRange,
  Attempt,
  AttemptOutcome,
  DashboardData,
  Difficulty,
  ErrorBreakdownEntry,
  ErrorKind,
  MasteryCell,
  Problem,
  ProfileData,
  QueueSpec,
  ReviewItem,
  SessionSummary,
  SolvedItem,
  TimeBucket,
  TrendPoint,
  WeakSpot,
} from "@/lib/types";
import { citationOf } from "@/lib/citation";
import { PRACTICE_STATUSES } from "@/lib/queue";
import { problems, profile, textbooks, topics } from "./fixtures";

/** Anchored so generated history never drifts between renders. Replaced by real
 *  timestamps when the database lands. */
const REFERENCE_DATE = new Date("2026-08-25T04:00:00.000Z");
const HISTORY_DAYS = 70;

/** Latent per-topic ability, so weak spots, the mastery grid, and the trend all
 *  tell the same story instead of contradicting each other. */
const ABILITY: Record<string, number> = {
  limits: 0.76,
  derivatives: 0.82,
  integration: 0.63,
  series: 0.51,
  "vector-spaces": 0.71,
  eigen: 0.44,
  orthogonality: 0.58,
  combinatorics: 0.79,
  "random-variables": 0.68,
  distributions: 0.65,
};

const ERROR_KINDS: ErrorKind[] = [
  "conceptual",
  "arithmetic",
  "setup",
  "incomplete",
];

function mulberry32(seed: number) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildAttempts(): Attempt[] {
  const rand = mulberry32(20260825);
  const list: Attempt[] = [];
  const topicIds = topics.map((t) => t.id);
  let counter = 0;

  for (let daysAgo = HISTORY_DAYS; daysAgo >= 0; daysAgo--) {
    const date = new Date(REFERENCE_DATE);
    date.setUTCDate(date.getUTCDate() - daysAgo);
    const weekday = date.getUTCDay();

    // Study happens most weekdays and rarely on Saturdays.
    const studyChance = weekday === 6 ? 0.4 : weekday === 0 ? 0.65 : 0.9;
    if (rand() > studyChance) continue;

    const count = 5 + Math.floor(rand() * 12);
    for (let i = 0; i < count; i++) {
      const topicId = topicIds[Math.floor(rand() * topicIds.length)];
      const difficulty = (1 + Math.floor(rand() * 5)) as Difficulty;

      // Ability improves slowly over the history window. The ceiling stays
      // below 1 so no topic can round to a suspiciously perfect 100%.
      const growth = ((HISTORY_DAYS - daysAgo) / HISTORY_DAYS) * 0.1;
      const chance = Math.min(
        0.88,
        Math.max(0.08, ABILITY[topicId] + growth - (difficulty - 3) * 0.12)
      );

      const roll = rand();
      let outcome: AttemptOutcome;
      if (roll < chance) outcome = "correct";
      else if (roll < chance + 0.06) outcome = "partial";
      else if (roll > 0.985) outcome = "skipped";
      else outcome = "incorrect";

      const base = 60 + difficulty * 100;
      const seconds = Math.round(base * (0.5 + rand() * 1.2));

      const at = new Date(date);
      at.setUTCHours(16 + Math.floor(rand() * 6), Math.floor(rand() * 60));

      list.push({
        id: `a_${(counter++).toString().padStart(4, "0")}`,
        problemId: problems[Math.floor(rand() * problems.length)].id,
        outcome,
        errorKind:
          outcome === "correct"
            ? undefined
            : ERROR_KINDS[Math.floor(rand() * ERROR_KINDS.length)],
        submittedAnswer: "",
        seconds,
        at: at.toISOString(),
        topicId,
        difficulty,
      });
    }
  }

  return list;
}

const attempts = buildAttempts();

function isScored(a: Attempt) {
  return a.outcome !== "skipped";
}

function accuracyOf(list: Attempt[]) {
  const scored = list.filter(isScored);
  if (scored.length === 0) return 0;
  const correct = scored.filter((a) => a.outcome === "correct").length;
  return (correct / scored.length) * 100;
}

function rangeStart(range: AnalyticsRange) {
  if (range === "all") return new Date(0);
  const days = range === "7d" ? 7 : 30;
  const start = new Date(REFERENCE_DATE);
  start.setUTCDate(start.getUTCDate() - days);
  return start;
}

function withinRange(list: Attempt[], range: AnalyticsRange) {
  const start = rangeStart(range);
  return list.filter((a) => new Date(a.at) >= start);
}

function computeStreak(): number {
  const days = new Set(attempts.map((a) => dayKey(new Date(a.at))));
  const cursor = new Date(REFERENCE_DATE);

  // A streak survives a day that is still in progress, so start counting from
  // yesterday when nothing has been solved yet today.
  if (!days.has(dayKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function sessionSummaries(list: Attempt[], count: number): SessionSummary[] {
  const byDay = new Map<string, Attempt[]>();
  for (const a of list) {
    const key = dayKey(new Date(a.at));
    const bucket = byDay.get(key);
    if (bucket) bucket.push(a);
    else byDay.set(key, [a]);
  }

  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, count)
    .reverse()
    .map(([date, list]) => ({
      date,
      attempted: list.length,
      correct: list.filter((a) => a.outcome === "correct").length,
      minutes: Math.round(list.reduce((sum, a) => sum + a.seconds, 0) / 60),
    }));
}

function topicAccuracy(list: Attempt[]): WeakSpot[] {
  return topics
    .map((topic) => {
      const forTopic = list.filter((a) => a.topicId === topic.id && isScored(a));
      return {
        topicId: topic.id,
        label: topic.name,
        accuracy: accuracyOf(forTopic),
        attempted: forTopic.length,
      };
    })
    .filter((entry) => entry.attempted > 0);
}

export async function getDashboard(): Promise<DashboardData> {
  const recent = [...attempts]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 40)
    .reverse();

  const current = withinRange(attempts, "30d");
  const start = rangeStart("30d");
  const priorStart = new Date(start);
  priorStart.setUTCDate(priorStart.getUTCDate() - 30);
  const prior = attempts.filter((a) => {
    const at = new Date(a.at);
    return at >= priorStart && at < start;
  });

  const sortedSeconds = current
    .filter(isScored)
    .map((a) => a.seconds)
    .sort((a, b) => a - b);

  const weakSpots = topicAccuracy(current)
    .filter((entry) => entry.attempted >= 5)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  // Drawn from the same filter that /solve uses, so the dashboard count and
  // the session position cannot disagree.
  const queue = problems.filter((p) => PRACTICE_STATUSES.includes(p.status));

  const recentSolved: SolvedItem[] = [...attempts]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 8)
    .map((attempt) => {
      const problem = problems.find((p) => p.id === attempt.problemId);
      return {
        attemptId: attempt.id,
        problemId: attempt.problemId,
        citation: problem
          ? citationOf(
              problem,
              textbooks.find((book) => book.id === problem.source.textbookId)
            )
          : attempt.problemId,
        outcome: attempt.outcome,
        seconds: attempt.seconds,
        at: attempt.at,
      };
    });

  return {
    profile,
    streakDays: computeStreak(),
    lifetime: {
      // Skips are not solves, so they are excluded from both figures.
      solved: attempts.filter(isScored).length,
      accuracy: accuracyOf(attempts),
      mastered: problems.filter((p) => p.status === "mastered").length,
    },
    recentSolved,
    summary: {
      accuracy: accuracyOf(current),
      accuracyDelta: accuracyOf(current) - accuracyOf(prior),
      attempted: current.length,
      medianSeconds:
        sortedSeconds.length === 0
          ? 0
          : sortedSeconds[Math.floor(sortedSeconds.length / 2)],
    },
    recentAttempts: recent,
    weakSpots,
    sessions: sessionSummaries(attempts, 7),
    queuedCount: queue.length,
  };
}

export async function getStreak(): Promise<number> {
  return computeStreak();
}

export async function getProblem(id: string): Promise<Problem | null> {
  return problems.find((p) => p.id === id) ?? null;
}

export async function getQueue(spec: Partial<QueueSpec>): Promise<Problem[]> {
  return problems.filter((p) => {
    if (spec.textbookIds?.length && !spec.textbookIds.includes(p.source.textbookId))
      return false;
    if (spec.topicIds?.length && !spec.topicIds.includes(p.topicId)) return false;
    if (spec.kinds?.length && !spec.kinds.includes(p.kind)) return false;
    if (spec.difficulties?.length && !spec.difficulties.includes(p.difficulty))
      return false;
    if (spec.statuses?.length && !spec.statuses.includes(p.status)) return false;
    return true;
  });
}

export async function getAnalytics(
  range: AnalyticsRange = "30d"
): Promise<AnalyticsData> {
  const current = withinRange(attempts, range);

  const start = rangeStart(range);
  const spanMs =
    range === "all"
      ? REFERENCE_DATE.getTime() - new Date(attempts[0].at).getTime()
      : REFERENCE_DATE.getTime() - start.getTime();
  const priorStart = new Date(start.getTime() - spanMs);
  const prior = attempts.filter((a) => {
    const at = new Date(a.at);
    return at >= priorStart && at < start;
  });

  const scored = current.filter(isScored);
  const sortedSeconds = scored.map((a) => a.seconds).sort((a, b) => a - b);
  const medianSeconds =
    sortedSeconds.length === 0
      ? 0
      : sortedSeconds[Math.floor(sortedSeconds.length / 2)];

  const byDay = new Map<string, Attempt[]>();
  for (const a of current) {
    const key = dayKey(new Date(a.at));
    const bucket = byDay.get(key);
    if (bucket) bucket.push(a);
    else byDay.set(key, [a]);
  }
  const trend: TrendPoint[] = [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, list]) => ({
      date,
      accuracy: accuracyOf(list),
      attempted: list.length,
    }));

  const mastery: MasteryCell[] = [];
  for (const topic of topics) {
    for (let d = 1; d <= 5; d++) {
      const cellAttempts = current.filter(
        (a) => a.topicId === topic.id && a.difficulty === d && isScored(a)
      );
      mastery.push({
        topicId: topic.id,
        topicName: topic.name,
        difficulty: d as Difficulty,
        accuracy: accuracyOf(cellAttempts),
        attempted: cellAttempts.length,
      });
    }
  }

  const errorBreakdown: ErrorBreakdownEntry[] = ERROR_KINDS.map((kind) => ({
    kind,
    count: current.filter((a) => a.errorKind === kind).length,
  })).sort((a, b) => b.count - a.count);

  const bucketBounds = [120, 240, 420, 720, Infinity];
  const bucketLabels = ["<2m", "2-4m", "4-7m", "7-12m", "12m+"];
  const timeDistribution: TimeBucket[] = bucketBounds.map((upper, i) => {
    const lower = i === 0 ? 0 : bucketBounds[i - 1];
    return {
      label: bucketLabels[i],
      upperSeconds: upper === Infinity ? 9999 : upper,
      count: scored.filter((a) => a.seconds > lower && a.seconds <= upper).length,
    };
  });

  const missCounts = new Map<string, { misses: number; last: string }>();
  for (const a of current) {
    if (a.outcome === "correct" || a.outcome === "skipped") continue;
    const entry = missCounts.get(a.problemId);
    if (entry) {
      entry.misses++;
      if (a.at > entry.last) entry.last = a.at;
    } else {
      missCounts.set(a.problemId, { misses: 1, last: a.at });
    }
  }

  const readyToReview: ReviewItem[] = [...missCounts.entries()]
    .map(([problemId, entry]) => {
      const problem = problems.find((p) => p.id === problemId);
      const topic = topics.find((t) => t.id === problem?.topicId);
      return {
        problemId,
        label: problem
          ? `${problem.source.chapter}.${problem.source.problemNumber} ${problem.subtopic}`
          : problemId,
        topicName: topic?.name ?? "Unknown",
        difficulty: problem?.difficulty ?? (3 as Difficulty),
        lastMissedAt: entry.last,
        misses: entry.misses,
      };
    })
    .sort((a, b) => b.misses - a.misses)
    .slice(0, 6);

  return {
    range,
    accuracy: accuracyOf(current),
    accuracyDelta: accuracyOf(current) - accuracyOf(prior),
    attempted: current.length,
    medianSeconds,
    streakDays: computeStreak(),
    trend,
    sessions: sessionSummaries(current, 7),
    mastery,
    errorBreakdown,
    timeDistribution,
    topicAccuracy: topicAccuracy(current).sort((a, b) => b.accuracy - a.accuracy),
    readyToReview,
  };
}

export async function getProfileData(
  range: AnalyticsRange = "30d"
): Promise<ProfileData> {
  return {
    profile,
    textbooks,
    analytics: await getAnalytics(range),
  };
}

export { topics, textbooks, problems, profile };
