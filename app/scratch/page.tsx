import type { Metadata } from "next";
import { ArrowRightIcon, UploadSimpleIcon } from "@phosphor-icons/react/ssr";
import { Button, IconButton } from "@/components/ui/button";
import { Shortcut, Tag } from "@/components/ui/chip";
import {
  EmptyState,
  ErrorNote,
  Skeleton,
  SkeletonText,
} from "@/components/ui/feedback";
import { PanelHeader, Rule, Surface } from "@/components/ui/surface";
import {
  DifficultyMeter,
  Metric,
  OutcomeBadge,
  Stat,
} from "@/components/ui/stat";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DemoControls } from "./demo-controls";

export const metadata: Metadata = {
  title: "Design system",
};

const SURFACE_TOKENS = [
  { name: "bg", className: "bg-bg" },
  { name: "surface", className: "bg-surface" },
  { name: "surface-2", className: "bg-surface-2" },
  { name: "surface-3", className: "bg-surface-3" },
  { name: "line", className: "bg-line" },
  { name: "line-strong", className: "bg-line-strong" },
];

const SIGNAL_TOKENS = [
  { name: "accent", className: "bg-accent" },
  { name: "accent-soft", className: "bg-accent-soft" },
  { name: "ember", className: "bg-ember" },
  { name: "ember-soft", className: "bg-ember-soft" },
  { name: "flag", className: "bg-flag" },
  { name: "flag-soft", className: "bg-flag-soft" },
];

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6 py-10">
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {note ? (
          <p className="max-w-[68ch] text-[15px] leading-relaxed text-ink-2">
            {note}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`h-16 rounded-control border border-line ${className}`}
      />
      <span className="font-mono text-[12px] text-ink-3">{name}</span>
    </div>
  );
}

export default function ScratchPage() {
  return (
    <div className="min-h-[100dvh] bg-bg">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-lg text-ink">Margin</span>
            <span className="text-[13px] text-ink-3">Design system</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 pb-24 md:px-6 lg:px-8">
        <Section
          title="Typography"
          note="Bricolage Grotesque carries display type, Geist carries the interface, and Geist Mono carries every number so figures never shift width as they update."
        >
          <div className="flex flex-col gap-6">
            <p className="font-display text-3xl text-ink md:text-4xl">
              You missed six integration problems this week
            </p>
            <p className="text-lg font-semibold tracking-[-0.01em] text-ink">
              Section heading, Geist semibold
            </p>
            <p className="max-w-[68ch] text-[15px] leading-relaxed text-ink-2">
              Body copy sits at fifteen pixels with relaxed leading and a
              sixty-eight character measure. It stays comfortable for the length
              of a worked solution without turning the page into a wall.
            </p>
            <p className="text-[13px] text-ink-3">
              Secondary meta, thirteen pixels, tertiary ink.
            </p>
            <div className="flex flex-wrap items-baseline gap-8">
              <Stat label="Accuracy" value="73.4%" delta={4.2} size="xl" />
              <Stat label="Attempted" value="412" size="lg" />
              <Stat label="Median time" value="6:18" size="sm" />
              <Stat label="Streak" value="9" unit="days" size="sm" />
            </div>
          </div>
        </Section>

        <Rule />

        <Section
          title="Color"
          note="One accent, locked. Cobalt is both the brand color and the correct signal, ember marks a miss, and the pairing stays legible for red-green color blindness."
        >
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {SURFACE_TOKENS.map((token) => (
                <Swatch key={token.name} {...token} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {SIGNAL_TOKENS.map((token) => (
                <Swatch key={token.name} {...token} />
              ))}
            </div>
          </div>
        </Section>

        <Rule />

        <Section
          title="Controls"
          note="Buttons, chips, and fields. Labels sit above inputs, hints and errors below, and placeholder text is never used as a label."
        >
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Start practice</Button>
              <Button variant="secondary">Build a queue</Button>
              <Button variant="ghost">Skip</Button>
              <Button variant="quiet">
                Drill this
                <ArrowRightIcon size={16} />
              </Button>
              <Button disabled>Unavailable</Button>
              <IconButton label="Upload problems">
                <UploadSimpleIcon size={18} />
              </IconButton>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>

            <DemoControls />

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[13px] text-ink-2">Submit</span>
              <Shortcut>Enter</Shortcut>
              <span className="text-[13px] text-ink-2">Next problem</span>
              <Shortcut>N</Shortcut>
              <span className="text-[13px] text-ink-2">Flag</span>
              <Shortcut>F</Shortcut>
            </div>
          </div>
        </Section>

        <Rule />

        <Section
          title="Data display"
          note="Panels are separated by hairlines and a background step rather than drop shadows. Elevation is reserved for true overlays."
        >
          <div className="grid gap-6 lg:grid-cols-12">
            <Surface className="lg:col-span-7">
              <PanelHeader
                title="Up next"
                hint="3 problems"
                action={
                  <Button variant="quiet" size="sm">
                    Change filters
                  </Button>
                }
              />
              <ul className="divide-y divide-line">
                {[
                  {
                    id: "7.2.31",
                    title: "Trigonometric integrals",
                    tags: ["u-substitution", "odd power"],
                    difficulty: 2,
                  },
                  {
                    id: "11.8.9",
                    title: "Power series",
                    tags: ["ratio test", "endpoint behavior"],
                    difficulty: 4,
                  },
                  {
                    id: "5.A.11",
                    title: "Eigenvector independence",
                    tags: ["proof", "induction"],
                    difficulty: 5,
                  },
                ].map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <div className="flex items-baseline gap-2.5">
                        <span className="font-mono tnum text-[13px] text-ink-3">
                          {row.id}
                        </span>
                        <span className="truncate text-sm font-medium text-ink">
                          {row.title}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {row.tags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </div>
                    </div>
                    <DifficultyMeter value={row.difficulty} />
                  </li>
                ))}
              </ul>
            </Surface>

            <Surface className="lg:col-span-5">
              <PanelHeader title="Last session" hint="Aug 24" />
              <div className="flex flex-col px-5 py-2">
                <Metric label="Attempted">14</Metric>
                <Metric label="Correct">9</Metric>
                <Metric label="Accuracy">64.3%</Metric>
                <Metric label="Time">48 min</Metric>
              </div>
              <Rule />
              <div className="flex flex-wrap gap-2 px-5 py-4">
                <OutcomeBadge outcome="correct" />
                <OutcomeBadge outcome="incorrect" />
                <OutcomeBadge outcome="partial" />
                <OutcomeBadge outcome="skipped" />
              </div>
            </Surface>
          </div>
        </Section>

        <Rule />

        <Section
          title="States"
          note="Every data surface ships loading, empty, and error states, not just the happy path. Skeletons mirror the geometry of what they replace."
        >
          <div className="grid gap-6 lg:grid-cols-12">
            <Surface className="lg:col-span-5">
              <PanelHeader title="Loading" />
              <div className="flex flex-col gap-4 px-5 py-5">
                <Skeleton className="h-16 w-full" />
                <SkeletonText lines={3} />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24 rounded-full" />
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              </div>
            </Surface>

            <div className="flex flex-col gap-6 lg:col-span-7">
              <EmptyState
                title="No problems yet"
                body="Upload a chapter from one of your textbooks and we will classify each problem by topic, type, and difficulty so you can filter them."
                action={
                  <Button size="sm">
                    <UploadSimpleIcon size={16} />
                    Upload problems
                  </Button>
                }
              />
              <ErrorNote
                title="That file did not parse"
                body="We could not read page 4 of the scan. Try a clearer photo, or type the problem in manually."
                action={
                  <Button variant="secondary" size="sm">
                    Try again
                  </Button>
                }
              />
            </div>
          </div>
        </Section>

        <Rule />

        <Section
          title="Substrate"
          note="The notebook grid appears behind empty states and page backdrops at four percent opacity. It is never applied to scrolling containers."
        >
          <div className="grid-paper flex h-40 items-center justify-center rounded-surface border border-line">
            <span className="font-mono text-[13px] text-ink-3">
              24px grid, grid-paper utility
            </span>
          </div>
        </Section>
      </main>
    </div>
  );
}
