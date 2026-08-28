"use server";

import { revalidatePath } from "next/cache";
import { gradeAnswer } from "@/lib/grade";
import { renderMathHtml, renderTex } from "@/lib/math";
import { getProblem, recordAttempt, updateAttemptOutcome } from "@/lib/mock/api";
import type { AttemptOutcome } from "@/lib/types";

export interface SubmissionResult {
  attemptId: string;
  outcome: AttemptOutcome;
  selfGraded: boolean;
  answerHtml: string;
  subtopic: string;
  chapterTitle: string;
  tags: string[];
}

/**
 * Grading happens here rather than in the browser so the answer key never
 * reaches the client before a student has committed to an answer. Records
 * the attempt so the dashboard ribbon, recent list, and profile charts pick
 * it up on their next render.
 */
export async function submitAnswer(
  problemId: string,
  submitted: string,
  seconds: number
): Promise<SubmissionResult> {
  const problem = await getProblem(problemId);
  if (!problem) throw new Error("Problem not found");

  const { outcome, selfGraded } = gradeAnswer(problem, submitted);

  // Error kind is chosen from the feedback panel after this returns, not at
  // submit time, so it isn't recorded here — see PLAN.md step 4.
  const attempt = await recordAttempt({
    problemId,
    outcome,
    submittedAnswer: submitted,
    seconds,
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile");

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
    attemptId: attempt.id,
    outcome,
    selfGraded,
    answerHtml,
    subtopic: problem.subtopic,
    chapterTitle: problem.source.chapterTitle,
    tags: problem.tags,
  };
}

/**
 * Overwrites a self-graded attempt once the student judges their own proof
 * against the reference — the first submitAnswer call already wrote it as
 * `partial`, since nothing else can grade free response at submit time.
 */
export async function confirmGrade(
  attemptId: string,
  outcome: AttemptOutcome
): Promise<void> {
  await updateAttemptOutcome(attemptId, outcome);
  revalidatePath("/dashboard");
  revalidatePath("/profile");
}
