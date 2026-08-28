import { describe, expect, it } from "vitest";
import { toSolveProblem } from "@/lib/problem";
import type { Problem } from "@/lib/types";

/** Every field a Problem can carry, including the ones the spoiler rule
 *  withholds. If a new secret field is added to Problem without updating
 *  this fixture, TypeScript — not this test — is the first line of defense;
 *  this test's job is to catch a field that IS on the fixture but leaks. */
function makeProblem(): Problem {
  return {
    id: "p_test",
    body: "Evaluate the integral.",
    source: {
      textbookId: "tb_test",
      chapter: "7.4",
      chapterTitle: "Partial Fractions",
      problemNumber: "31",
    },
    topicId: "integration",
    subtopic: "u-substitution",
    tags: ["substitution", "log-rule"],
    difficulty: 4,
    kind: "computational",
    answerFormat: { kind: "expression" },
    answer: "2/15",
    acceptedAnswers: ["0.1333"],
    workedSolution: "Let u = ...",
    estimatedMinutes: 8,
    status: "unattempted",
  };
}

const SECRET_KEYS = [
  "answer",
  "acceptedAnswers",
  "workedSolution",
  "tags",
  "subtopic",
  "source",
] as const;

const ALLOWED_KEYS = [
  "id",
  "body",
  "topicId",
  "difficulty",
  "kind",
  "answerFormat",
  "estimatedMinutes",
  "status",
] as const;

describe("toSolveProblem", () => {
  it("excludes every field the spoiler rule withholds", () => {
    const solveProblem = toSolveProblem(makeProblem());
    for (const key of SECRET_KEYS) {
      expect(solveProblem).not.toHaveProperty(key);
    }
  });

  it("carries exactly the allowed fields — no more, no fewer", () => {
    const solveProblem = toSolveProblem(makeProblem());
    expect(Object.keys(solveProblem).sort()).toEqual([...ALLOWED_KEYS].sort());
  });

  it("does not leak the answer key even by value elsewhere on the object", () => {
    const problem = makeProblem();
    const solveProblem = toSolveProblem(problem);
    const serialized = JSON.stringify(solveProblem);
    expect(serialized).not.toContain(problem.answer);
    expect(serialized).not.toContain(problem.subtopic);
    expect(serialized).not.toContain(problem.source.chapterTitle);
  });
});
