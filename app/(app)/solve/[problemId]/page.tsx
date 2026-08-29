import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "katex/dist/katex.min.css";
import { SolveSurface } from "@/components/solve/solve-surface";
import { getProblem, getQueue } from "@/lib/mock/api";
import { renderMathHtml } from "@/lib/math";
import { textbooks } from "@/lib/mock/fixtures";
import { citationOf } from "@/lib/citation";
import { toSolveProblem } from "@/lib/problem";
import { parseQueueSpec, recapHref, solveHref } from "@/lib/queue";

export async function generateMetadata(
  props: PageProps<"/solve/[problemId]">
): Promise<Metadata> {
  const { problemId } = await props.params;
  const problem = await getProblem(problemId);
  if (!problem) return { title: "Solve" };
  // The citation, not the subtopic: a tab reading "Partial fractions" would
  // give away the method before the student has tried anything.
  return {
    title: `Problem ${problem.source.chapter}.${problem.source.problemNumber}`,
  };
}

export default async function SolveProblemPage(
  props: PageProps<"/solve/[problemId]">
) {
  const [{ problemId }, params] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const problem = await getProblem(problemId);

  if (!problem) notFound();

  const queue = await getQueue(parseQueueSpec(params));
  const position = queue.findIndex((item) => item.id === problem.id);
  const inQueue = position >= 0;
  const next = inQueue ? queue[position + 1] : undefined;
  const textbook = textbooks.find((item) => item.id === problem.source.textbookId);

  return (
    <SolveSurface
      problem={toSolveProblem(problem)}
      bodyHtml={renderMathHtml(problem.body)}
      citation={citationOf(problem, textbook)}
      // Finishing goes to the session recap, with filters intact so its own
      // "keep working on X" action can carry them forward.
      nextHref={next ? solveHref(next.id, params) : recapHref(params)}
      hasNext={Boolean(next)}
      index={inQueue ? position + 1 : 1}
      total={inQueue ? queue.length : 1}
    />
  );
}
