import type { Metadata } from "next";
import Link from "next/link";
import { PracticeFilters } from "@/components/dashboard/practice-filters";
import { ProfileSnapshot } from "@/components/dashboard/profile-snapshot";
import { RecentSolved } from "@/components/dashboard/recent-solved";
import { UploadPanel } from "@/components/dashboard/upload-panel";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { PanelHeader, Surface } from "@/components/ui/surface";
import { getDashboard, getMockNow, getQueue } from "@/lib/mock/api";
import { textbooks, topics } from "@/lib/mock/fixtures";
import {
  FILTERABLE_STATUSES,
  KIND_LABELS,
  PROBLEM_KINDS,
  STATUS_LABELS,
  parseQueueSpec,
} from "@/lib/queue";
import type { Problem, QueueSpec } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const params = await props.searchParams;
  const spec = parseQueueSpec(params);

  const [data, matches, library, mockNow] = await Promise.all([
    getDashboard(),
    getQueue(spec),
    getQueue({}),
    getMockNow(),
  ]);

  /** Facet counts ignore the group being counted, so a chip shows what you
   *  would get by adding it rather than what you already have. */
  const [difficultyBase, kindBase, statusBase] = await Promise.all([
    getQueue({ ...spec, difficulties: [] }),
    getQueue({ ...spec, kinds: [] }),
    getQueue({ ...spec, statuses: [] } as Partial<QueueSpec>),
  ]);

  const countBy = (list: Problem[], predicate: (p: Problem) => boolean) =>
    list.filter(predicate).length;

  const strands = [...new Set(topics.map((topic) => topic.strand))];

  return (
    <div className="flex flex-1 flex-col gap-4 py-5 lg:h-[calc(100dvh-6rem)] lg:min-h-0 lg:overflow-hidden">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl text-ink">Dashboard</h1>
        <p className="text-[13px] text-ink-2">
          Pick what to work on, add problems from your textbooks, and see how the
          last stretch went.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-12">
        {/* Recent work on the left, where reading starts; the controls that
            launch the next session sit together on the right. */}
        <Surface className="flex min-h-0 flex-col lg:col-span-7">
          <PanelHeader title="Recently solved" hint="Last 40 attempts" />
          {data.recentSolved.length > 0 ? (
            <RecentSolved
              attempts={data.recentAttempts}
              solved={data.recentSolved}
              // The real Date() would put a freshly recorded attempt "2 days
              // ago" — attempts are stamped against the same mock clock.
              now={mockNow}
            />
          ) : (
            <div className="p-5">
              <EmptyState
                title="Nothing solved yet"
                body="Problems you answer show up here, newest first, with how each one went."
                className="border-0 py-6"
              />
            </div>
          )}
        </Surface>

        <div className="flex min-h-0 flex-col gap-4 lg:col-span-5">
          <Surface className="shrink-0">
            <ProfileSnapshot
              profile={data.profile}
              lifetime={data.lifetime}
              streakDays={data.streakDays}
            />
          </Surface>

          {/* Zero-decision path: no filters to set, just the queue as it stands.
              The filter panel below is for when you want to be specific. */}
          <Surface className="flex shrink-0 items-center gap-4 px-4 py-3.5">
            <div className="flex min-w-0 flex-col">
              <p className="text-[13px] font-medium text-ink">
                {data.queuedCount > 0
                  ? `${data.queuedCount} problem${data.queuedCount === 1 ? "" : "s"} ready`
                  : "Nothing queued right now"}
              </p>
              <p className="text-[12px] text-ink-3">
                {data.queuedCount > 0
                  ? "No filters needed — jump straight in."
                  : "Add problems below, or loosen your filters."}
              </p>
            </div>
            {data.queuedCount > 0 ? (
              <Link
                href="/solve"
                className={`${buttonStyles("primary", "md")} ml-auto shrink-0`}
              >
                Start practice
              </Link>
            ) : null}
          </Surface>

          <Surface className="flex shrink-0 flex-col">
            <PanelHeader
              title="Or, choose what to work on"
              hint={`${matches.length} of ${library.length}`}
            />
            <PracticeFilters
              textbooks={textbooks.map((book) => ({
                value: book.id,
                label: `${book.authors.split(" ").pop()} · ${book.title}`,
              }))}
              topicGroups={strands.map((strand) => ({
                strand,
                topics: topics
                  .filter((topic) => topic.strand === strand)
                  .map((topic) => ({ value: topic.id, label: topic.name })),
              }))}
              difficulties={[1, 2, 3, 4, 5].map((level) => ({
                value: String(level),
                label: String(level),
                count: countBy(difficultyBase, (p) => p.difficulty === level),
              }))}
              kinds={PROBLEM_KINDS.map((kind) => ({
                value: kind,
                label: KIND_LABELS[kind],
                count: countBy(kindBase, (p) => p.kind === kind),
              }))}
              statuses={FILTERABLE_STATUSES.map((status) => ({
                value: status,
                label: STATUS_LABELS[status],
                count: countBy(statusBase, (p) => p.status === status),
              }))}
              matchCount={matches.length}
              minutes={matches.reduce(
                (sum, p) => sum + p.estimatedMinutes,
                0
              )}
            />
          </Surface>

          {/* Takes the leftover height, so the dropzone absorbs whatever the
              viewport has spare instead of overflowing it. */}
          <Surface className="flex min-h-0 flex-1 flex-col">
            <PanelHeader title="Add problems" />
            <UploadPanel />
          </Surface>
        </div>
      </div>
    </div>
  );
}
