# Margin — Current Capabilities & Backend Structure

Written 2026-08-27, after `PLAN.md` steps 1–5. This is a snapshot of what the
app actually does today, verified against the code rather than summarized
from memory — not a plan, not a pitch. For what's still missing or planned,
see `PLAN.md`. For the psychological/UX read, see `ENGAGEMENT_ANALYSIS.md`.

---

## 1. What the product is

A three-page practice tool: **Dashboard** (launcher), **Solve** (one problem
at a time), **Profile** (diagnostics). No fourth page, no separate queue
builder — filters live on the dashboard, analytics live on the profile, and
that split is a deliberate, stated product decision, not an oversight.

The core mechanic is the **spoiler rule**: a problem's topic, subtopic, tags,
answer key, and section heading are withheld from the browser until the
student submits an answer. This is enforced structurally (a hand-written
allowlist function, not a UI convention), not just visually.

---

## 2. What actually works today

Everything below is live against an in-memory mock store — real
grading, real persistence within a server process, real derived state. There
is no database and no auth (see §5), but within a single running server the
behavior is functionally complete, not a static mockup.

### Dashboard (`/dashboard`)

- **Recently solved** — last 40 attempts as a tick ribbon (oldest→newest,
  color-coded by outcome), plus the last 8 as a list with citation, outcome,
  and elapsed time. Updates immediately after a real submission.
- **Profile snapshot** — name, lifetime solved/accuracy/streak, links to
  `/profile`.
- **Zero-decision start** — a "Start practice" bar showing how many problems
  are queued (`queuedCount`, computed server-side) with a one-click link into
  `/solve` that requires no filter configuration.
- **Filters** — textbook and topic dropdowns; difficulty, kind, and status as
  chips. Every chip shows a live count of how many problems you'd get by
  adding it, computed by re-running the query with that one dimension
  cleared (facet counts ignore the group being counted). Zero matches
  disables "Start practice" rather than allowing an empty session.
- The filter spec lives entirely in the URL query string (`book`, `topic`,
  `d`, `kind`, `status`), so it survives navigation into Solve and back.
- **Upload dropzone** — drag-and-drop or file picker (image/PDF), lists
  queued filenames, honest copy that nothing is parsed yet (see §4).

### Solve (`/solve`, `/solve/[problemId]`)

- `/solve` is a pure entry point: it evaluates the current filter spec,
  redirects to the first matching problem, and carries the filters into the
  URL. An empty queue shows a real empty state, not a dead end.
- **Problem display** — KaTeX-typeset body (server-rendered), citation
  (`Stewart 7.2 #31` — numbers only, no section title), difficulty as five
  ticks, estimated time, position in queue (`3 of 12`).
- **Answer input**, one of four kinds, selected by the problem's
  `answerFormat`:
  - *Expression* — text field with a live KaTeX preview, LaTeX accepted.
  - *Numeric* — text field with optional unit suffix.
  - *Choice* — radio group.
  - *Free-response* — textarea for proofs, explicitly self-graded.
- **Grading** (`lib/grade.ts`, unit-tested) runs server-side inside the
  submit action, so the answer key never reaches the client pre-submit:
  - Expression/numeric: fraction↔decimal equivalence (`2/15` ≡ `0.1333`),
    trailing `+ C` ignored, whitespace/case-insensitive, tolerance bands for
    numeric answers, `acceptedAnswers` checked as alternates.
  - Choice: exact id match.
  - Free-response: always comes back `partial` + self-graded — the student
    compares their own work to the revealed reference and marks themselves
    "I got this" / "I missed it", which **overwrites** the recorded attempt.
  - Empty submission grades as `skipped`, regardless of format.
- **Feedback panel** — outcome badge, the real answer (typeset), then the
  classification that was withheld pre-submit (chapter, subtopic, tags). An
  optional, non-blocking chip lets you mark *why* you missed it (conceptual /
  arithmetic / setup / incomplete) — picking one persists it onto the
  attempt immediately.
- **Timer** — counts up, isolated so the per-second tick doesn't re-render
  the surface; elapsed seconds are read via an imperative ref at submit time
  and sent to the server as part of the attempt.
- **Flag** — a per-problem flag (icon button or `F`), persists across
  navigation and keeps the problem in the practice queue regardless of its
  otherwise-derived status.
- **Skip** — records a `skipped` attempt in the background (fire-and-forget,
  so it doesn't block or reveal the answer) and advances immediately. The
  `N` shortcut is the same action under a different trigger.
- **Layout** — one CSS grid (`.solve-grid`) that rearranges via
  `grid-template-areas` at the `lg` breakpoint: a resizable, draggable
  two-pane split on desktop (position remembered in `localStorage`), tabbed
  Problem/Notes on mobile. The problem body, answer input, and notes pad each
  mount exactly once regardless of viewport — not two parallel hidden/shown
  trees.
- **Notes pad** — per-problem scratch space, autosaved to `localStorage`
  (uncontrolled textarea, hydrated via ref — no re-render per keystroke).
- **Keyboard shortcuts** — `Enter` submit/advance, `⌘/Ctrl+Enter` from the
  notes pad, `N` next/skip, `F` flag, `?` shortcut sheet (focus-trapped,
  restores focus on close, suppresses background shortcuts while open),
  `Esc` closes it.
- A first-run hint ("Topic and method stay hidden until you answer") shows
  for a few problems then stops, tracked via `localStorage`.

### Profile (`/profile`)

- **Performance** — accuracy (with delta vs. the prior window), attempted
  count, median time, streak, for a selectable range (`7d` / `30d` / `all`,
  in the URL).
- **Accuracy over time** — one point per study day, straight line segments
  (no interpolation between days nobody studied).
- **Mastery grid** — topic × difficulty, color = accuracy, **opacity = sample
  size**, so two lucky answers can't visually pass as mastery.
- **Where it goes wrong** — breakdown by self-reported error kind, mixing
  seeded history with live marks made during the session.
- **Time per problem** — a histogram over five duration buckets.
- **Weak spots** — lowest-accuracy topics first, each linking to a
  pre-filtered dashboard.
- **Ready to review** — problems missed more than once, worst first.
- **Study sessions** — last 7 study days, one row each.
- **Textbooks** — solved/total per source (static fixture counts, not yet
  derived from live attempts — see §5).

### Cross-cutting

- **Dark/light theme**, dark by default, applied pre-paint via an inline
  script (no flash), toggle persists to `localStorage`.
- **Loading and error boundaries** on every route: dashboard, profile, and
  the solve entry point each have a skeleton that mirrors their real layout;
  dashboard and profile have their own `error.tsx`; a root `error.tsx`
  backstops anything else under `(app)/`.
- **404** — custom page, not the framework default.
- **Design system** — CSS custom properties for color, a four-tier shape
  lock (surfaces 12px / controls 8px / micro 4px / chips fully round), a
  documented z-index scale, `prefers-reduced-motion` honored globally and
  per-component, tabular numerals everywhere a number updates so stats don't
  jitter.

### What's a working stub, not a real feature

- **`/upload`** — the route exists and is reachable, but is an honest
  placeholder: "The upload flow is not built yet." The dashboard's dropzone
  is the real UI surface (collects files locally), but nothing is parsed,
  OCR'd, or classified yet. This is `PLAN.md` step 6, not yet started.
- **`/scratch`** — a 420-line internal design-token/component gallery.
  Reachable in development, returns a real 404 in production
  (`NODE_ENV`-gated). Not part of the product's navigation.

---

## 3. Backend structure

There is no database, no server outside Next.js itself, and no network
boundary — "backend" here means the data-access layer, which is deliberately
shaped like a real one so it can be swapped later without rewriting screens.

### The shape

```
Client (Server & Client Components)
        │
        ▼
app/(app)/solve/actions.ts     "use server" — the only mutation entry point
        │
        ▼
lib/mock/api.ts                the entire "backend": in-memory store + query layer
        │
        ▼
lib/mock/fixtures.ts           static seed data (16 problems, 3 textbooks, 10 topics, 1 user)
```

Every page is an `async` Server Component that calls into `lib/mock/api.ts`
directly — there is no HTTP hop, no REST/GraphQL layer, no client-side data
fetching library. Mutations go through Next.js **Server Actions**
(`"use server"` functions in `actions.ts`), invoked directly from Client
Components as if they were local async functions, with `revalidatePath`
calls to invalidate the router cache for affected routes.

### The store

`lib/mock/api.ts` holds a single module-level mutable array of `Attempt`
records, plus a `Set` of flagged problem ids. Both live only as long as the
Node process does — restarting `next dev` resets everything.

- **Seed generation.** `buildAttempts()` deterministically generates ~70 days
  of history using a seeded PRNG (`mulberry32(20260825)`), anchored to a
  fixed `REFERENCE_DATE` (2026-08-25). Per-topic latent "ability" values
  drive correctness probability, so the trend chart, mastery grid, and weak
  spots all tell a consistent story instead of being independently random.
  This function is pure and re-runs identically on every server start.
- **Live writes.** `recordAttempt()` appends to the *same* array the seeded
  data lives in — there's no separate "live" store to keep in sync.
  `updateAttemptOutcome()` and `updateAttemptErrorKind()` mutate an existing
  attempt in place (the proof self-grade overwrite, and error-kind tagging
  after the fact).
- **The mock clock.** A `now()` helper returns `REFERENCE_DATE` offset by
  real elapsed time since the module loaded — not `Date.now()` directly.
  Every range/streak calculation in this file is anchored to
  `REFERENCE_DATE` as "today"; stamping live attempts with the real wall
  clock would silently drop them out of the streak's backward-walk (which
  never looks forward past `REFERENCE_DATE`) while still counting them
  toward `attempted`. This was a real bug caught mid-implementation, not a
  hypothetical. The clock still ticks forward through a session so
  sequential attempts sort correctly; it just starts at the fixed instant.
  Holds correctly for any session under ~24h; a multi-day-uptime dev server
  would need real revisiting (noted in `PLAN.md`).
- **Derived status.** `Problem.status` is never read from the static
  fixture. `derivedStatus(problemId)` computes it live: a flag wins over
  everything; otherwise the most recent *scored* attempt decides (correct →
  `mastered`, incorrect/partial → `missed`, a trailing skip doesn't count as
  a verdict); no scored attempt at all → `unattempted`. This is applied at
  the two points `Problem` objects leave the module (`getProblem`,
  `getQueue`) and wherever `getDashboard` counts by status, so every
  consumer inherits it automatically.

### The public surface (six async functions, signatures held stable across
all of steps 1–5 specifically so the UI layer never had to change)

| Function | Returns | Notes |
| --- | --- | --- |
| `getDashboard()` | `DashboardData` | ribbon, recent list, lifetime stats, 30d summary, weak spots, sessions, queued count |
| `getQueue(spec)` | `Problem[]` | filtered by textbook/topic/kind/difficulty/status, effective status applied |
| `getProblem(id)` | `Problem \| null` | effective status applied |
| `getAnalytics(range)` | `AnalyticsData` | the whole Profile page's data, range = `7d`/`30d`/`all` |
| `getProfileData(range)` | `ProfileData` | wraps `getAnalytics` + profile + textbooks |
| `getStreak()` | `number` | used standalone by the top bar so it doesn't need the full dashboard payload |

Plus the mutators added in steps 3–4: `recordAttempt`, `updateAttemptOutcome`,
`updateAttemptErrorKind`, `flagProblem`, and `getMockNow` (exposes the mock
clock to the dashboard's relative-time labels).

### The mutation path in detail

```
solve-surface.tsx (client)
   │  submitAnswer(problemId, answer, seconds)
   ▼
actions.ts "use server"
   │  1. getProblem(id)
   │  2. gradeAnswer(problem, answer)      lib/grade.ts, pure, unit-tested
   │  3. recordAttempt({...})              lib/mock/api.ts
   │  4. revalidatePath("/dashboard", "/profile")
   │  5. render the answer to HTML server-side (renderTex/renderMathHtml)
   ▼
returns { attemptId, outcome, answerHtml, subtopic, chapterTitle, tags }
```

The answer key and classification are computed and returned **only after**
grading — they never exist in a pre-submit client payload. `attemptId` comes
back so the client can later call `confirmGrade` (proof overwrite) or
`setAttemptErrorKind` (tag a miss) against the same record.

### Spoiler enforcement mechanism

`lib/problem.ts` has two conversion functions, both allowlists (list what's
included, not what's excluded — a new field on `Problem` is withheld by
default):

- `toSolveProblem(problem): SolveProblem` — strips `answer`,
  `acceptedAnswers`, `workedSolution`, `tags`, `subtopic`, `source` before a
  `Problem` ever reaches a Client Component.
- `toQueuedProblem(problem, textbook): QueuedProblem` — same idea for list
  views (citation + body, no classification).

This is enforced by TypeScript's structural typing (`SolveProblem` is
`Omit<Problem, ...>`), not by convention — a component typed to receive
`SolveProblem` cannot access `.answer` even if it wanted to, because the
type doesn't have that field.

### Fixture data

`lib/mock/fixtures.ts`: 1 user (Priya Raghunathan, Calculus II), 3 textbooks
(Stewart, Axler, Ross), 10 topics across 3 strands (Calculus / Linear
algebra / Probability), 16 hand-written problems covering all four answer
formats and five difficulty levels.

### Testing

`vitest` (Node environment, no DOM — logic only), 39 tests across 4 files:

- `lib/grade.test.ts` — grading correctness across all four formats.
- `lib/queue.test.ts` — URL spec parsing/serialization.
- `lib/problem.test.ts` — the spoiler-redaction allowlist, asserted as an
  exact key set (not a spot check), so a new secret field added to `Problem`
  fails this test the moment someone forgets to also withhold it.
- `lib/mock/api.test.ts` — the mutable store itself: attempt recording
  visible on the next read, the mock clock's internal consistency, status
  derivation (including the flag-wins-over-grading case and the tie-break
  fix), error-kind persistence.

---

## 4. What's explicitly not real yet

Worth stating plainly rather than leaving implicit:

- **No database.** Everything in §3 lives in one JS array in server memory.
  A process restart erases every live attempt, flag, and error-kind tag back
  to the seeded baseline.
- **No auth, no multi-user.** One hardcoded profile. There is no concept of
  "your" data versus anyone else's.
- **No file processing.** The upload dropzone collects filenames; nothing is
  stored, OCR'd, or turned into a `Problem`.
- **No worked-solution reveal.** The field exists on `Problem`
  (`workedSolution`) and is carried through fixtures but never rendered
  anywhere in the UI.
- **Textbook progress is static.** `Textbook.solvedCount`/`problemCount` are
  fixture values, not derived from the live attempt stream the way
  `Problem.status` now is — so they can visibly disagree with reality once
  you've solved things live.
- **The mock clock is a same-day approximation**, not a real clock. Correct
  for any realistic dev/demo session; would need to become real time
  alongside a real database.

---

## 5. What's next

Short version, in order:

1. **Session recap** at the end of a queue (`PLAN.md` §3a item 10). The
   highest-impact single item identified in `ENGAGEMENT_ANALYSIS.md`, and it
   was gated on attempt persistence — which now exists, so it's unblocked.
   Right now "Finish" is a bare navigation event: the most memorable moment
   of a study session is nothing at all.
2. **Staged feedback reveal** (§3a item 6) — the other half of the same
   structural gap. A correct answer currently looks identical to a wrong one.
3. **Upload review step** (`PLAN.md` step 6) — the largest genuinely-missing
   screen, and the only place the product's stated promise ("add problems
   from the textbooks you own") is unmet.
4. Then steps 7–8: reachable empty states, consistency polish.
5. Then the backend phase: auth, database, real ingestion.

## 6. Everything traces back to one document

`PLAN.md` is the live source of truth for sequencing and rationale — every
commit referenced above (`92b7abe`, `679c5c4`, `b71f1d3`, etc.) corresponds
to a step there with its "done when" criteria and what was verified. Its §0
is the at-a-glance status table. `ENGAGEMENT_ANALYSIS.md` has a matching
coverage table for the behavioral findings. This document is a snapshot;
those are the plan and its scorecard.
