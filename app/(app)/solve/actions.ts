"use server";

import { gradeAnswer } from "@/lib/grade";
import { renderMathHtml, renderTex } from "@/lib/math";
import { getProblem } from "@/lib/mock/api";
import type { AttemptOutcome } from "@/lib/types";

export interface SubmissionResult {
  outcome: AttemptOutcome;
  selfGraded: boolean;
  answerHtml: string;
  subtopic: string;
  chapterTitle: string;
  tags: string[];
}

/**
 * Grading happens here rather than in the browser so the answer key never
 * reaches the client before a student has committed to an answer.
 */
export async function submitAnswer(
  problemId: string,
  submitted: string
): Promise<SubmissionResult> {
  const problem = await getProblem(problemId);
  if (!problem) throw new Error("Problem not found");

  const { outcome, selfGraded } = gradeAnswer(problem, submitted);

  const answerHtml =
    problem.answerFormat.kind === "choice"
      ? renderMathHtml(
          problem.answerFormat.choices?.find(
            (choice) => choice.id === problem.answer
          )?.body ?? problem.answer
        )
      : problem.answerFormat.kind === "free-response"
        ? renderMathHtml(problem.answer)
        : renderTex(problem.answer);

  return {
    outcome,
    selfGraded,
    answerHtml,
    subtopic: problem.subtopic,
    chapterTitle: problem.source.chapterTitle,
    tags: problem.tags,
  };
}
