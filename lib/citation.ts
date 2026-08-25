import type { Problem, Textbook } from "@/lib/types";

/** Identifies the problem in the student's own book without naming the method.
 *  The section heading joins the classification only after they answer. */
export function citationOf(problem: Problem, textbook?: Textbook) {
  const surname = textbook?.authors.split(" ").pop();
  const book = surname ?? "Problem";
  return `${book} ${problem.source.chapter} #${problem.source.problemNumber}`;
}
