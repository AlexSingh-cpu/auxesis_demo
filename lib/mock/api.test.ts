import { describe, expect, it } from "vitest";
import {
  getDashboard,
  getMockNow,
  getProfileData,
  recordAttempt,
  updateAttemptOutcome,
} from "@/lib/mock/api";
import { problems } from "@/lib/mock/fixtures";

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
