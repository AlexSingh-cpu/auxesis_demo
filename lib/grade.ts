import type { AttemptOutcome, Problem } from "@/lib/types";

/** Strips the cosmetic differences that should not cost a student the mark. */
function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/\\(left|right|,|;|!|\s)/g, "")
    .replace(/[\s{}]/g, "")
    .replace(/\\cdot|\\times/g, "*")
    .replace(/\+c$/, "");
}

function asNumber(value: string): number | null {
  const cleaned = value.replace(/[\s,]/g, "");
  const fraction = cleaned.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator === 0) return null;
    return Number(fraction[1]) / denominator;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export interface GradeResult {
  outcome: AttemptOutcome;
  /** True when the student has to judge their own work. */
  selfGraded: boolean;
}

export function gradeAnswer(problem: Problem, submitted: string): GradeResult {
  const trimmed = submitted.trim();
  if (trimmed === "") return { outcome: "skipped", selfGraded: false };

  const accepted = [problem.answer, ...(problem.acceptedAnswers ?? [])];

  switch (problem.answerFormat.kind) {
    case "free-response":
      return { outcome: "partial", selfGraded: true };

    case "choice":
      return {
        outcome: trimmed === problem.answer ? "correct" : "incorrect",
        selfGraded: false,
      };

    case "numeric": {
      const submittedValue = asNumber(trimmed);
      const tolerance = problem.answerFormat.tolerance ?? 0.001;
      const correct = accepted.some((candidate) => {
        const expected = asNumber(candidate);
        if (expected === null || submittedValue === null) return false;
        return Math.abs(expected - submittedValue) <= tolerance;
      });
      return { outcome: correct ? "correct" : "incorrect", selfGraded: false };
    }

    case "expression":
    default: {
      const submittedValue = asNumber(trimmed);
      const correct = accepted.some((candidate) => {
        if (normalize(candidate) === normalize(trimmed)) return true;
        // A fraction typed as a decimal, or the reverse, is still correct.
        const expected = asNumber(candidate);
        if (expected === null || submittedValue === null) return false;
        return Math.abs(expected - submittedValue) < 0.001;
      });
      return { outcome: correct ? "correct" : "incorrect", selfGraded: false };
    }
  }
}
