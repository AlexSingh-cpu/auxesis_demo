import { describe, expect, it } from "vitest";
import { gradeAnswer } from "@/lib/grade";
import type { Problem } from "@/lib/types";

/** A minimal valid Problem, overridable per test. Fields irrelevant to grading
 *  (source, topic, tags, ...) are filled with placeholders. */
function makeProblem(overrides: Partial<Problem> = {}): Problem {
  return {
    id: "p_test",
    body: "Test problem.",
    source: {
      textbookId: "tb_test",
      chapter: "1.1",
      chapterTitle: "Test chapter",
      problemNumber: "1",
    },
    topicId: "topic_test",
    subtopic: "Test subtopic",
    tags: [],
    difficulty: 3,
    kind: "computational",
    answerFormat: { kind: "expression" },
    answer: "1/2",
    estimatedMinutes: 5,
    status: "unattempted",
    ...overrides,
  };
}

describe("gradeAnswer", () => {
  it("marks an empty submission as skipped, regardless of format", () => {
    const problem = makeProblem();
    expect(gradeAnswer(problem, "")).toEqual({
      outcome: "skipped",
      selfGraded: false,
    });
    expect(gradeAnswer(problem, "   ")).toEqual({
      outcome: "skipped",
      selfGraded: false,
    });
  });

  describe("expression format", () => {
    it("accepts a fraction and its decimal equivalent as the same answer", () => {
      const problem = makeProblem({
        answerFormat: { kind: "expression" },
        answer: "2/15",
      });
      expect(gradeAnswer(problem, "0.1333").outcome).toBe("correct");
    });

    it("ignores a trailing + C", () => {
      const problem = makeProblem({
        answerFormat: { kind: "expression" },
        answer: "x^2",
      });
      expect(gradeAnswer(problem, "x^2 + C").outcome).toBe("correct");
    });

    it("is case- and whitespace-insensitive", () => {
      const problem = makeProblem({
        answerFormat: { kind: "expression" },
        answer: "\\frac{1}{2}",
      });
      expect(gradeAnswer(problem, "  \\FRAC{1}{2}  ").outcome).toBe("correct");
    });

    it("checks acceptedAnswers as alternates", () => {
      const problem = makeProblem({
        answerFormat: { kind: "expression" },
        answer: "1/2",
        acceptedAnswers: ["0.5"],
      });
      expect(gradeAnswer(problem, "0.5").outcome).toBe("correct");
    });

    it("marks a wrong expression incorrect", () => {
      const problem = makeProblem({
        answerFormat: { kind: "expression" },
        answer: "1/2",
      });
      expect(gradeAnswer(problem, "1/3").outcome).toBe("incorrect");
    });
  });

  describe("numeric format", () => {
    it("accepts a value within the default tolerance", () => {
      const problem = makeProblem({
        answerFormat: { kind: "numeric" },
        answer: "10",
      });
      // Default tolerance is 0.001; exactly at the boundary still counts (<=).
      expect(gradeAnswer(problem, "10.001").outcome).toBe("correct");
    });

    it("rejects a value just outside the declared tolerance", () => {
      const problem = makeProblem({
        answerFormat: { kind: "numeric", tolerance: 0.5 },
        answer: "10",
      });
      expect(gradeAnswer(problem, "10.5").outcome).toBe("correct");
      expect(gradeAnswer(problem, "10.51").outcome).toBe("incorrect");
    });

    it("parses a fraction as a numeric submission", () => {
      const problem = makeProblem({
        answerFormat: { kind: "numeric" },
        answer: "0.5",
      });
      expect(gradeAnswer(problem, "1/2").outcome).toBe("correct");
    });

    it("treats a non-numeric submission as incorrect rather than throwing", () => {
      const problem = makeProblem({
        answerFormat: { kind: "numeric" },
        answer: "10",
      });
      expect(gradeAnswer(problem, "not a number").outcome).toBe("incorrect");
    });
  });

  describe("choice format", () => {
    it("matches the exact choice id", () => {
      const problem = makeProblem({
        answerFormat: {
          kind: "choice",
          choices: [
            { id: "a", body: "First" },
            { id: "b", body: "Second" },
          ],
        },
        answer: "b",
      });
      expect(gradeAnswer(problem, "b").outcome).toBe("correct");
      expect(gradeAnswer(problem, "a").outcome).toBe("incorrect");
    });
  });

  describe("free-response format", () => {
    it("is always partial and self-graded, never auto-scored", () => {
      const problem = makeProblem({
        answerFormat: { kind: "free-response" },
        answer: "Proof sketch here.",
      });
      expect(gradeAnswer(problem, "My reasoning.")).toEqual({
        outcome: "partial",
        selfGraded: true,
      });
    });
  });
});
