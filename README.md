# Margin

Practice from the textbooks you already own. Filter the library down to the problems you actually want to work, solve them with room to show your working, and then look at *where* you go wrong — not just how often.

Margin is a three-page app. There is no fourth page hiding the analytics, and there is no separate queue builder. The dashboard is where you set up. Solve is where you work. Profile is where you review.

```
  dashboard ──filters in the URL──►  solve ──finish──►  dashboard
      │                                │
      │                                │  misses, time, error kind
      └──────── profile ◄──────────────┘
```

Dark by default. Light if you choose it. The graph-paper motif shows up on empty states and the dropzone, never on a scrolling list.

**Successor agents:** read [Development status](#development-status-read-this-before-changing-anything) before writing code. The screens, grading, and data layer are all live — submitting an answer really is recorded, flags and error kinds persist, `Problem.status` is derived from real attempts. What's missing is a database (everything lives in server memory), auth (one hardcoded user), and the upload → classification pipeline (`/upload` is still an honest stub). See [`OVERVIEW.md`](./OVERVIEW.md) for the full capability breakdown and [`PLAN.md`](./PLAN.md) for what's next and why, in order — this file doesn't duplicate either.

---

## The three pages

### Dashboard — launcher, one screen

On a large laptop this is meant to fit without scrolling.

| Column | What it holds |
| --- | --- |
| **Left** | Last 40 attempts as a tick ribbon (oldest → newest), then the last eight as a list: outcome, citation, time. |
| **Right** | A strip of lifetime stats (solved, percent correct, streak), the filter panel, then a dropzone for adding problems. |

A **Start practice** bar sits above the filters and needs no configuration — it shows how many problems are queued and goes straight into `/solve`. The filters below it are for when you want to be specific, not the default path: textbook and topic are dropdowns, difficulty/type/status are chips, and each chip shows how many problems you would get by adding it, given the other filters already on. Zero matches disables the filtered **Start practice** rather than letting you walk into an empty session.

The spec lives in the query string, so it survives the hop into Solve and comes back with you when the session ends:

```
/dashboard?kind=proof&d=5
/solve/p_0229?kind=proof&d=5     ← 1 of 1
/dashboard?kind=proof&d=5        ← finish returns here, filters intact
```

Citations look like `Stewart 7.2 #31`. Topic names and method tags stay off this list — naming “partial fractions” on the dashboard would hand over the method one click before the solve screen withholds it.

### Solve — one problem at a time

`/solve` is an entry point, not a destination. It redirects to the first matching problem and carries the filters along. If nothing matches, it says so and sends you back to adjust them.

While a problem is open you see:

- Position in the queue (`2 of 2` inside a filter, `8 of 13` without one)
- Difficulty as five ticks, not a number that needs a legend
- A textbook citation, never the section heading
- The body, typeset with KaTeX on the server
- An answer control that matches the problem: expression with a live preview, numeric with unit and tolerance, multiple choice, or a free-response pad for proofs
- Working notes, autosaved per problem to local storage, on a timer that only ticks until you submit

Desktop is two panes with a draggable divider (arrow keys work; the position is remembered). Phone is Problem / Notes tabs and a sticky action bar.

**After you submit**, feedback is inline. Outcome, the typeset answer, and then — only then — the classification: chapter title, subtopic, tags. On a miss you mark what went wrong: concept, arithmetic, setup, or incomplete, and it's saved to that attempt as soon as you pick it. Proofs are self-graded against the reference — tapping "I got this" or "I missed it" overwrites the recorded attempt, not just the screen.

Flagging a problem and skipping it both persist: a flag survives navigation and keeps the problem in your queue; a skip is recorded as a `skipped` attempt in the background so it doesn't sit invisibly outside your history, without waiting on that write to advance you.

| Key | Action |
| --- | --- |
| `Enter` | Submit, then advance |
| `⌘/Ctrl + Enter` | Submit from the notes pad |
| `N` | Next problem (skips and records it, if not yet submitted) |
| `F` | Flag |
| `?` | Shortcut sheet |
| `Esc` | Close it |

### Profile — the diagnostic, not the trophy case

Identity is compact: name, course, join date. The rest of the page is why you came.

- **Performance** — accuracy (with a delta against the previous window), attempted, median time, streak
- **Accuracy over time** — one point per study day, straight segments. Interpolating a curve would invent readings nobody took.
- **Mastery** — topic against difficulty 1–5. Colour is accuracy; opacity is sample size, so two lucky answers never look like mastery.
- **Where it goes wrong** — conceptual / arithmetic / setup / incomplete, as you marked them
- **Time per problem** — how long things actually take
- **Weak spots** — lowest accuracy first; each topic links back to a filtered dashboard
- **Ready to review** — problems missed more than once
- **Study sessions** — the last week, one row per day
- **Textbooks** — solved / total for each source

Range is 7 days, 30 days, or all time. Default is 30. Changing it recomputes every panel. The dashboard’s lifetime percentage will not match the profile’s 30-day window. That is on purpose.

---

## The spoiler rule

Anything that names the *method* is withheld until you have committed to an answer.

Kept off the client until submit:

- the answer key and accepted equivalents
- subtopic and tags (`u-substitution` is the method)
- the section heading (`7.4 Partial Fractions` gives it away as surely as a tag)

What you *are* allowed to see: the problem body, a number-only citation, difficulty, estimated time. Grading is a server action, so view-source cannot leak the key. The browser tab title is `Problem 7.2.31`, not the subtopic.

---

## How an answer is marked

| Format | What counts |
| --- | --- |
| Choice | Exact option |
| Numeric | Within the problem’s tolerance; fractions and decimals both parse |
| Expression | Normalized LaTeX (`2/15` ≡ `0.1333`, spacing and `+ C` ignored) |
| Proof / free-response | You compare against the reference and mark it yourself |
| Empty submit | Skipped |

Placeholders are generic (`3/4`, `12.5`). They are never the actual answer of the problem on screen.

---

## Visual system

An engineering notebook, not a dashboard template.

- **Ink on paper** — `--ink`, `--ink-2`, `--ink-3` on `--bg` / `--surface`. Accent is a working blue. Ember is a miss. Flag/gold is partial.
- **Type** — Geist for UI, Geist Mono for numbers, citations, and notes (tabular numerals, so stats do not jitter), Bricolage Grotesque for display.
- **Shape lock** — surfaces 12, controls 8, ticks 4, chips the only pill.
- **Motion** — hierarchy, feedback, state change. No loops. `prefers-reduced-motion` is honoured.
- **Loading** — skeletons that match the layout they replace. Never a spinner.

Theme is stored under `margin-theme` and applied before first paint so the page does not flash.

---

## Development status (read this before changing anything)

The screens, design system, grading, URL-driven queue, and data layer are all **live** — this is not a static mockup. Submitting an answer really is graded, recorded as an `Attempt`, and reflected on the dashboard and profile without a reload. Flags and error-kind tags persist. `Problem.status` (`mastered` / `missed` / `flagged` / `unattempted`) is derived from real attempt history, not read off a static fixture. Full breakdown, function-by-function: **[`OVERVIEW.md`](./OVERVIEW.md)**.

What's still missing, in the order it's sequenced: the upload → classification pipeline (`/upload` is a working stub — the dashboard's dropzone collects files but nothing is parsed yet), then auth (one hardcoded user) and a real database (everything above lives in one JS array in server memory — a process restart erases every live attempt back to the seeded baseline). Full plan, with rationale for the ordering and a "done when" check per step: **[`PLAN.md`](./PLAN.md)**. Don't maintain a second copy of that list here — update `PLAN.md` and let this file stay a pointer.

**Stack (locked):** Next.js **16.3.2** App Router, React **19.2.8**, Tailwind **v4.3**, TypeScript, Vitest. APIs differ from older Next.js. Before writing routes or server actions, read `node_modules/next/dist/docs/` (see `AGENTS.md`). Do not assume Pages Router, `next/head`, or Tailwind v3 `@tailwind` directives.

**Mock clock:** attempt history is generated against `REFERENCE_DATE = 2026-08-25T04:00:00.000Z` in `lib/mock/api.ts` (mulberry32 seed `20260825`). Live attempts are stamped by a `now()` helper — real elapsed time since the module loaded, offset to start at `REFERENCE_DATE` — not `Date.now()` directly; the streak and range calculations are anchored to `REFERENCE_DATE` as "today" and a live attempt on the real wall clock would silently fall outside that window. Holds correctly for any single session; a multi-day dev-server uptime is the one case that needs real revisiting (noted in `PLAN.md`).

**Product decisions already made (do not silently reverse):**

- Analytics live on **Profile**, not Dashboard. Dashboard is a launcher.
- Filters live on **Dashboard**. Do not recreate `/queue`.
- Dark is the default theme. Tokens: `--ink` / `--surface` / `--accent` / `--ember` / `--flag`. Shape lock: 12 / 8 / 4 / pill-chips-only.
- `toSolveProblem` **lists allowed fields**. Adding a secret to `Problem` must not automatically ship it to the client — `lib/problem.test.ts` asserts the exact allowed key set, so a forgotten field fails a test instead of leaking silently.
- Empty status filter means `PRACTICE_STATUSES` (unattempted, missed, flagged, in-progress), not "match nothing."
- Facet counts ignore the group being counted.
- Lifetime stats on the dashboard vs 30-day stats on the profile are **supposed** to disagree.
- `Problem.status` is never read from the static fixture — always through `derivedStatus()` in `lib/mock/api.ts`. A new read site must go through `getProblem`/`getQueue`, not the raw fixture array.
- The error-kind chip stays optional and inline; do not gate advancing on classifying a miss (see `ENGAGEMENT_ANALYSIS.md` §5.3 for why).
- `/upload` gets the real review UI when it's built — do not invent a fourth nav item; the dashboard dropzone is the entry point.

When adding fields to `Problem`, update `toSolveProblem` / `SolveProblem` deliberately. Prefer withholding.

Out of scope unless asked: a public marketing landing page, social/sharing, spaced-repetition beyond "missed more than once," live multiplayer, a native app, a second navigation model.

---

### Fixture inventory (mock)

User `u_1` Priya Raghunathan, course Calculus II MATH 152.

Textbooks: Stewart *Calculus: Early Transcendentals* 8e, Axler *Linear Algebra Done Right* 4e, Ross *A First Course in Probability* 10e.

Topics: limits, derivatives, integration, series, vector-spaces, eigen, orthogonality, combinatorics, random-variables, distributions.

Problems `p_0431` … `p_0470` (16 ids in `lib/mock/fixtures.ts`).

---

### Local storage keys (client-only)

| Key | Purpose |
| --- | --- |
| `margin-theme` | `"dark"` \| `"light"` |
| `margin-notes-<problemId>` | Scratch pad |
| `margin-solve-split` | Desktop divider, e.g. `58%` |
| `margin-spoiler-hint-seen` | Count of problems where the "topic and method stay hidden" hint has shown; stops after a few |

---

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You land on the dashboard.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve that build |
| `npm run lint` | ESLint |
| `npm test` | Vitest — logic only, no browser (`lib/**/*.test.ts`) |

---

## Stack

Next.js 16 (App Router), React 19, Tailwind v4, KaTeX, Motion, Phosphor icons, Vitest. TypeScript throughout. The mock API in `lib/mock/` is shaped like the real one will be — async functions returning the same types — so the screens do not have to be rewritten when a database arrives.

```
app/(app)/                    dashboard · solve · profile
app/(app)/solve/actions.ts    the only mutation entry point ("use server")
components/                   ui primitives, then dashboard / solve / profile / shell
lib/mock/                     fixtures + the in-memory attempt/flag store + query layer
lib/grade.ts                  marking
lib/math.ts                   server-side KaTeX
lib/queue.ts                  URL spec for a session
lib/*.test.ts                 vitest — grader, queue parsing, spoiler redaction, the store itself
```

---

Margin, in the typesetting sense: the space beside the problem where the work actually happens.
