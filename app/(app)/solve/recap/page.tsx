import type { Metadata } from "next";
import Link from "next/link";
import { AttemptRibbon } from "@/components/dashboard/attempt-ribbon";
import { RecapMissList } from "@/components/solve/recap-miss-list";
import { PageHeader } from "@/components/shell/page-header";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Stat } from "@/components/ui/stat";
import { PanelHeader, Surface } from "@/components/ui/surface";
import { citationOf } from "@/lib/citation";
import { getSessionRecap } from "@/lib/mock/api";
import { problems, textbooks } from "@/lib/mock/fixtures";
import { dashboardHref, queueQuery } from "@/lib/queue";
import { formatDuration, formatPercent } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Session recap",
};

export default async function RecapPage(props: PageProps<"/solve/recap">) {
  const params = await props.searchParams;
  const recap = await getSessionRecap();

  if (recap.attempted === 0) {
    return (
      <>
        <PageHeader title="Session recap" />
        <EmptyState
          title="Nothing to recap yet"
          body="This page summarizes the problems you just worked through. Solve a few, then come back."
          action={
            <Link href={dashboardHref(params)} className={buttonStyles("primary")}>
              Back to dashboard
            </Link>
          }
          className="py-20"
        />
      </>
    );
  }

  const citations: Record<string, string> = {};
  for (const miss of recap.unclassifiedMisses) {
    const problem = problems.find((p) => p.id === miss.problemId);
    if (!problem) continue;
    const textbook = textbooks.find((book) => book.id === problem.source.textbookId);
    citations[miss.id] = citationOf(problem, textbook);
  }

  const practiceWeakestHref = recap.weakestTopic
    ? `/solve${queueQuery({ ...params, topic: recap.weakestTopic.topicId })}`
    : null;

  return (
    <>
      <PageHeader
        title="Session recap"
        description="Here's how that session went."
      />

      <div className="flex flex-col gap-6 pb-8">
        <Surface>
          <PanelHeader title="This session" />
          <div className="grid grid-cols-2 gap-6 p-5 sm:grid-cols-4">
            <Stat label="Attempted" value={String(recap.attempted)} />
            <Stat label="Correct" value={String(recap.correct)} />
            <Stat label="Accuracy" value={formatPercent(recap.accuracy, 0)} />
            <Stat
              label="Median time"
              value={formatDuration(recap.medianSeconds)}
            />
          </div>
          <div className="border-t border-line p-5">
            <AttemptRibbon attempts={recap.attempts} />
          </div>
        </Surface>

        {recap.unclassifiedMisses.length > 0 ? (
          <Surface>
            <PanelHeader
              title="Still unclassified"
              hint="What went wrong on these?"
            />
            <div className="p-5">
              <RecapMissList
                misses={recap.unclassifiedMisses}
                citations={citations}
              />
            </div>
          </Surface>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {practiceWeakestHref ? (
            <Link href={practiceWeakestHref} className={buttonStyles("primary")}>
              Keep working on {recap.weakestTopic!.label}
            </Link>
          ) : null}
          <Link href={dashboardHref(params)} className={buttonStyles("secondary")}>
            Back to dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
