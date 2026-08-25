import { citationOf } from "@/lib/citation";
import { renderMathHtml } from "@/lib/math";
import type {
  Problem,
  QueuedProblem,
  SolveProblem,
  Textbook,
} from "@/lib/types";

/** Built by listing what the client may see, so a new field on `Problem` is
 *  withheld by default rather than leaking until someone remembers it. */
export function toSolveProblem(problem: Problem): SolveProblem {
  return {
    id: problem.id,
    body: problem.body,
    topicId: problem.topicId,
    difficulty: problem.difficulty,
    kind: problem.kind,
    answerFormat: problem.answerFormat,
    estimatedMinutes: problem.estimatedMinutes,
    status: problem.status,
  };
}

/** Pulls KaTeX in, so this module must only be imported from server components. */
export function toQueuedProblem(
  problem: Problem,
  textbook?: Textbook
): QueuedProblem {
  return {
    id: problem.id,
    bodyHtml: renderMathHtml(problem.body),
    citation: citationOf(problem, textbook),
    difficulty: problem.difficulty,
    estimatedMinutes: problem.estimatedMinutes,
    status: problem.status,
  };
}
