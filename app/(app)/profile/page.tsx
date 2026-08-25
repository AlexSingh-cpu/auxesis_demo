import type { Metadata } from "next";
import { BooksIcon } from "@phosphor-icons/react/ssr";
import { ErrorBreakdown } from "@/components/profile/error-breakdown";
import { MasteryGrid } from "@/components/profile/mastery-grid";
import { RangeSelect } from "@/components/profile/range-select";
import { ReviewList } from "@/components/profile/review-list";
import { SessionList } from "@/components/profile/session-list";
import { TimeDistribution } from "@/components/profile/time-distribution";
import { TrendChart } from "@/components/profile/trend-chart";
import { WeakSpots } from "@/components/profile/weak-spots";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/feedback";
import { Stat } from "@/components/ui/stat";
import { PanelHeader, Surface } from "@/components/ui/surface";
import { getProfileData } from "@/lib/mock/api";
import type { AnalyticsRange } from "@/lib/types";
import { formatDate, formatDuration, formatPercent } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Profile",
};

const RANGE_LABEL: Record<AnalyticsRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

function parseRange(value: string | string[] | undefined): AnalyticsRange {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "7d" || raw === "all" ? raw : "30d";
}

export default async function ProfilePage(props: PageProps<"/profile">) {
  const params = await props.searchParams;
  const range = parseRange(params.range);
  const { profile, textbooks, analytics } = await getProfileData(range);

  return (
    <>
      {/* Identity stays compact. Nobody visits their own profile to read their
          own name; the analytics below are the reason this page exists. */}
      <header className="flex flex-col gap-5 pb-7 pt-8 sm:flex-row sm:items-center md:pt-10">
        <Avatar name={profile.name} size="lg" />
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl text-ink">{profile.name}</h1>
          <p className="text-[15px] text-ink-2">{profile.course}</p>
          <p className="font-mono text-[13px] text-ink-3">
            Joined {formatDate(profile.joinedAt)}
          </p>
        </div>
        <div className="sm:ml-auto">
          <RangeSelect value={range} />
        </div>
      </header>

      <div className="flex flex-col gap-6 pb-4">
        <Surface>
          <PanelHeader title="Performance" hint={RANGE_LABEL[range]} />
          <div className="grid grid-cols-2 gap-6 p-5 sm:grid-cols-4">
            <Stat
              label="Accuracy"
              value={formatPercent(analytics.accuracy)}
              delta={analytics.accuracyDelta}
            />
            <Stat label="Attempted" value={String(analytics.attempted)} />
            <Stat
              label="Median time"
              value={formatDuration(analytics.medianSeconds)}
            />
            <Stat
              label="Streak"
              value={String(analytics.streakDays)}
              unit={analytics.streakDays === 1 ? "day" : "days"}
            />
          </div>
        </Surface>

        <Surface>
          <PanelHeader title="Accuracy over time" hint="Per study day" />
          <TrendChart points={analytics.trend} />
        </Surface>

        <Surface>
          <PanelHeader
            title="Mastery"
            hint="Topic against difficulty"
          />
          <MasteryGrid cells={analytics.mastery} />
        </Surface>

        <div className="grid gap-6 lg:grid-cols-2">
          <Surface>
            <PanelHeader title="Where it goes wrong" hint="Self-reported" />
            <ErrorBreakdown entries={analytics.errorBreakdown} />
          </Surface>

          <Surface>
            <PanelHeader title="Time per problem" />
            <TimeDistribution buckets={analytics.timeDistribution} />
          </Surface>

          <Surface>
            <PanelHeader title="Weak spots" hint="Lowest accuracy first" />
            {analytics.topicAccuracy.length > 0 ? (
              <WeakSpots
                spots={[...analytics.topicAccuracy]
                  .sort((a, b) => a.accuracy - b.accuracy)
                  .slice(0, 6)}
              />
            ) : (
              <div className="p-5">
                <EmptyState
                  title="Not enough attempts yet"
                  body="Topics appear here once you have attempted a few problems in them."
                  className="border-0 py-6"
                />
              </div>
            )}
          </Surface>

          <Surface>
            <PanelHeader title="Ready to review" hint="Missed more than once" />
            {analytics.readyToReview.length > 0 ? (
              <ReviewList items={analytics.readyToReview} />
            ) : (
              <div className="p-5">
                <EmptyState
                  title="Nothing outstanding"
                  body="Problems you miss repeatedly collect here so you can take a second pass at them."
                  className="border-0 py-6"
                />
              </div>
            )}
          </Surface>
        </div>

        <Surface>
          <PanelHeader title="Study sessions" hint="Most recent first" />
          <SessionList sessions={analytics.sessions} />
        </Surface>

        <Surface>
          <PanelHeader title="Textbooks" hint={`${textbooks.length} sources`} />
          <ul className="divide-y divide-line">
            {textbooks.map((book) => (
              <li key={book.id} className="flex items-center gap-4 px-5 py-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-control border border-line bg-surface-2 text-ink-3">
                  <BooksIcon size={18} />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-sm font-medium text-ink">
                    {book.title}
                  </p>
                  <p className="truncate text-[13px] text-ink-3">
                    {book.authors}
                    {book.edition ? `, ${book.edition}` : ""}
                  </p>
                </div>
                <p className="ml-auto shrink-0 font-mono tnum text-[13px] text-ink-2">
                  {book.solvedCount}
                  <span className="text-ink-3">/{book.problemCount}</span>
                </p>
              </li>
            ))}
          </ul>
        </Surface>
      </div>
    </>
  );
}
