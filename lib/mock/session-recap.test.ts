import { describe, expect, it } from "vitest";
import {
  getSessionRecap,
  recordAttempt,
  updateAttemptErrorKind,
} from "@/lib/mock/api";

/** integration, difficulty 2 — unused by lib/mock/api.test.ts. */
const TOPIC_A_ID = "p_0431";
/** series, difficulty 4 — unused by lib/mock/api.test.ts. */
const TOPIC_B_ID = "p_0462";

describe("getSessionRecap", () => {
  it("returns an empty recap when nothing has been attempted yet", async () => {
    const recap = await getSessionRecap();
    expect(recap).toEqual({
      attempted: 0,
      correct: 0,
      accuracy: 0,
      medianSeconds: 0,
      attempts: [],
      weakestTopic: null,
      unclassifiedMisses: [],
    });
  });

  it("summarizes the live attempts just recorded", async () => {
    await recordAttempt({
      problemId: TOPIC_A_ID,
      outcome: "correct",
      submittedAnswer: "2/15",
      seconds: 60,
    });
    const wrong = await recordAttempt({
      problemId: TOPIC_A_ID,
      outcome: "incorrect",
      submittedAnswer: "x",
      seconds: 40,
    });

    const recap = await getSessionRecap();

    expect(recap.attempted).toBe(2);
    expect(recap.correct).toBe(1);
    expect(recap.accuracy).toBe(50);
    expect(recap.medianSeconds).toBe(60);
    expect(recap.attempts.map((a) => a.id)).toEqual(
      expect.arrayContaining([wrong.id])
    );
  });

  it("identifies the weakest topic among session attempts", async () => {
    // Topic A (integration) is at 50% from the previous test; give topic B
    // (series) a clean record so it should not be picked.
    await recordAttempt({
      problemId: TOPIC_B_ID,
      outcome: "correct",
      submittedAnswer: "right",
      seconds: 30,
    });

    const recap = await getSessionRecap();
    expect(recap.weakestTopic?.topicId).toBe("integration");
  });

  it("lists misses that have no error kind yet", async () => {
    const recap = await getSessionRecap();
    expect(recap.unclassifiedMisses.length).toBeGreaterThan(0);
  });

  it("excludes a miss once it has been classified", async () => {
    const before = await getSessionRecap();
    const miss = before.unclassifiedMisses[0];
    await updateAttemptErrorKind(miss.id, "arithmetic");

    const after = await getSessionRecap();
    expect(after.unclassifiedMisses.some((a) => a.id === miss.id)).toBe(
      false
    );
  });
});
