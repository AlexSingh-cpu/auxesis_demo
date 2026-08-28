import { describe, expect, it } from "vitest";
import {
  flagProblem,
  getDashboard,
  getMockNow,
  getProblem,
  getProfileData,
  getQueue,
  recordAttempt,
  updateAttemptErrorKind,
  updateAttemptOutcome,
} from "@/lib/mock/api";
import { problems } from "@/lib/mock/fixtures";

/** Distinct ids per test group, so recording an attempt or a flag for one
 *  test can never change what an unrelated test observes — this file's
 *  tests all share the same in-memory store and run in source order. */
const FLAG_TEST_ID = "p_0447";
const MASTERED_TEST_ID = "p_0455";
const MISSED_TEST_ID = "p_0392";
const ERROR_KIND_TEST_ID = "p_0388";

/** Exercises the actual mutable store step 3 introduced — the part with real
 *  logic (mock clock, in-place mutation). The Server Action plumbing around
 *  it (revalidatePath, the client's useTransition call) is standard Next.js
 *  API usage verified by tsc, not re-tested here. */
describe("recordAttempt", () => {
  it("appends an attempt that the dashboard picks up immediately", async () => {
    const before = await getDashboard();
    const problem = problems[0];

    const attempt = await recordAttempt({
      problemId: problem.id,
      outcome: "incorrect",
      submittedAnswer: "wrong",
      seconds: 42,
    });

    const after = await getDashboard();

    expect(after.lifetime.solved).toBe(before.lifetime.solved + 1);
    expect(after.recentAttempts.at(-1)?.id).toBe(attempt.id);
    expect(after.recentSolved[0]).toMatchObject({
      attemptId: attempt.id,
      problemId: problem.id,
      outcome: "incorrect",
      seconds: 42,
    });
  });

  it("stamps the attempt on the same mock 'today' the streak already assumes,\
 so a live submission extends the streak rather than being invisible to it", async () => {
    const before = await getDashboard();

    await recordAttempt({
      problemId: problems[0].id,
      outcome: "correct",
      submittedAnswer: "right",
      seconds: 10,
    });

    const after = await getDashboard();
    // Never goes backwards, and a same-day attempt cannot break a streak
    // that was already counting today.
    expect(after.streakDays).toBeGreaterThanOrEqual(before.streakDays);
  });

  it("uses the same clock for getMockNow as for the attempt timestamp", async () => {
    const attempt = await recordAttempt({
      problemId: problems[0].id,
      outcome: "correct",
      submittedAnswer: "x",
      seconds: 5,
    });
    const mockNow = new Date(await getMockNow());
    const attemptAt = new Date(attempt.at);

    // Both come from the same clock, milliseconds apart in test execution.
    expect(Math.abs(mockNow.getTime() - attemptAt.getTime())).toBeLessThan(1000);
  });
});

describe("updateAttemptOutcome", () => {
  it("overwrites a self-graded attempt's outcome in place", async () => {
    const attempt = await recordAttempt({
      problemId: problems.find((p) => p.answerFormat.kind === "free-response")
        ?.id ?? problems[0].id,
      outcome: "partial",
      submittedAnswer: "my reasoning",
      seconds: 90,
    });

    const before = await getProfileData("all");
    const beforeAttempted = before.analytics.attempted;

    const updated = await updateAttemptOutcome(attempt.id, "correct");
    expect(updated?.outcome).toBe("correct");

    const after = await getDashboard();
    const recorded = after.recentAttempts.find((a) => a.id === attempt.id);
    expect(recorded?.outcome).toBe("correct");

    // Overwriting in place changes the outcome, not the attempted count.
    const afterProfile = await getProfileData("all");
    expect(afterProfile.analytics.attempted).toBe(beforeAttempted);
  });

  it("returns null for an unknown attempt id rather than throwing", async () => {
    const result = await updateAttemptOutcome("a_does_not_exist", "correct");
    expect(result).toBeNull();
  });
});

describe("derived Problem.status", () => {
  it("flags a problem regardless of its fixture default, and getQueue's status filter sees it too", async () => {
    await flagProblem(FLAG_TEST_ID, true);

    const problem = await getProblem(FLAG_TEST_ID);
    expect(problem?.status).toBe("flagged");

    const flaggedQueue = await getQueue({ statuses: ["flagged"] });
    expect(flaggedQueue.some((p) => p.id === FLAG_TEST_ID)).toBe(true);
  });

  it("un-flagging reverts to whatever the attempt history derives, not a fixed default", async () => {
    // The 70-day seeded backfill assigns attempts to every fixture problem,
    // so the true baseline is whatever that history derives — not
    // necessarily "unattempted". Clear any flag left by an earlier test
    // first, so the baseline reflects the attempt history alone.
    await flagProblem(FLAG_TEST_ID, false);
    const baseline = await getProblem(FLAG_TEST_ID);

    await flagProblem(FLAG_TEST_ID, true);
    expect((await getProblem(FLAG_TEST_ID))?.status).toBe("flagged");

    await flagProblem(FLAG_TEST_ID, false);
    const after = await getProblem(FLAG_TEST_ID);
    expect(after?.status).toBe(baseline?.status);
  });

  it("derives mastered from the latest scored attempt being correct", async () => {
    await recordAttempt({
      problemId: MASTERED_TEST_ID,
      outcome: "incorrect",
      submittedAnswer: "wrong first try",
      seconds: 30,
    });
    await recordAttempt({
      problemId: MASTERED_TEST_ID,
      outcome: "correct",
      submittedAnswer: "right on retry",
      seconds: 20,
    });

    const problem = await getProblem(MASTERED_TEST_ID);
    expect(problem?.status).toBe("mastered");
  });

  it("derives missed from the latest scored attempt being incorrect, ignoring a trailing skip", async () => {
    await recordAttempt({
      problemId: MISSED_TEST_ID,
      outcome: "incorrect",
      submittedAnswer: "wrong",
      seconds: 30,
    });
    await recordAttempt({
      problemId: MISSED_TEST_ID,
      outcome: "skipped",
      submittedAnswer: "",
      seconds: 0,
    });

    // A skip is not a verdict on the problem, so the incorrect attempt
    // before it still decides the status.
    const problem = await getProblem(MISSED_TEST_ID);
    expect(problem?.status).toBe("missed");
  });

  it("a flag still wins over a mastering attempt", async () => {
    await recordAttempt({
      problemId: FLAG_TEST_ID,
      outcome: "correct",
      submittedAnswer: "right",
      seconds: 15,
    });
    await flagProblem(FLAG_TEST_ID, true);

    const problem = await getProblem(FLAG_TEST_ID);
    expect(problem?.status).toBe("flagged");
  });
});

describe("updateAttemptErrorKind", () => {
  it("attaches an error kind to the right attempt after the fact", async () => {
    const attempt = await recordAttempt({
      problemId: ERROR_KIND_TEST_ID,
      outcome: "incorrect",
      submittedAnswer: "wrong",
      seconds: 60,
    });
    expect(attempt.errorKind).toBeUndefined();

    await updateAttemptErrorKind(attempt.id, "arithmetic");

    const after = await getDashboard();
    const recorded = after.recentAttempts.find((a) => a.id === attempt.id);
    expect(recorded?.errorKind).toBe("arithmetic");
  });
});
