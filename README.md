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

**Successor agents:** read [Development status](#development-status-read-this-before-changing-anything) before writing code. The UI is far ahead of the data layer. The next job is persisting attempts, not another page.

---

## The three pages

### Dashboard — launcher, one screen

On a large laptop this is meant to fit without scrolling.

| Column | What it holds |
| --- | --- |
| **Left** | Last 40 attempts as a tick ribbon (oldest → newest), then the last eight as a list: outcome, citation, time. |
| **Right** | A strip of lifetime stats (solved, percent correct, streak), the filter panel, then a dropzone for adding problems. |

The filters *are* the queue. Textbook and topic are dropdowns. Difficulty, type, and status are chips. Each chip shows how many problems you would get by adding it, given the other filters already on. Zero matches disables **Start practice** rather than letting you walk into an empty session.

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

**After you submit**, feedback is inline. Outcome, the typeset answer, and then — only then — the classification: chapter title, subtopic, tags. On a miss you mark what went wrong: concept, arithmetic, setup, or incomplete. Proofs are self-graded against the reference.

| Key | Action |
| --- | --- |
| `Enter` | Submit, then advance |
| `⌘/Ctrl + Enter` | Submit from the notes pad |
| `N` | Next problem |
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

This is a **frontend prototype on seeded mock data**. The screens, design system, grading, and URL-driven queue are built. There is **no database, no auth, and no persistence of attempts**. Submitting an answer grades it for that page load only; it does not update the dashboard ribbon, the profile charts, problem `status`, or the mock store.

**Stack (locked):** Next.js **16.3.2** App Router, React **19.2.8**, Tailwind **v4.3**, TypeScript. APIs differ from older Next.js. Before writing routes or server actions, read `node_modules/next/dist/docs/` (see `AGENTS.md`). Do not assume Pages Router, `next/head`, or Tailwind v3 `@tailwind` directives.

**Mock clock:** attempt history is generated against `REFERENCE_DATE = 2026-08-25T04:00:00.000Z` in `lib/mock/api.ts` (mulberry32 seed `20260825`). Do not use `Date.now()` for those derived stats or the streak will drift.

---

### Done — do not rebuild

| Area | What exists | Where |
| --- | --- | --- |
| Design tokens, dark-first theme, graph-paper, fonts | CSS variables, `dark`/`light` on `<html>`, no-flash script | `app/globals.css`, `app/layout.tsx`, `lib/theme.ts` |
| UI primitives | Button, Field, Chip, Surface, Stat, Skeleton, EmptyState, Segmented, Avatar, ThemeToggle | `components/ui/` |
| App shell | Top bar (segmented nav + named profile chip), mobile tab bar, page chrome | `components/shell/`, `app/(app)/layout.tsx` |
| Three-page IA | Dashboard launcher, Solve, Profile. **No `/queue` route** (deleted on purpose). | `app/(app)/dashboard`, `solve`, `profile` |
| Domain types | Problem, Attempt, QueueSpec, analytics shapes, `SolveProblem` redaction | `lib/types.ts` |
| Mock library | 16 handcrafted problems, 3 textbooks, 10 topics, 1 user, ~70 days of attempts | `lib/mock/fixtures.ts`, `lib/mock/api.ts` |
| Queue / filters | URL spec `book`, `topic`, `d`, `kind`, `status`; faceted chip counts; default status = not mastered | `lib/queue.ts`, `components/dashboard/practice-filters.tsx` |
| Session continuity | `/solve` redirects to first match; next/finish keep the query string; finish → `/dashboard?…` | `app/(app)/solve/page.tsx`, `solve/[problemId]/page.tsx` |
| KaTeX | Server `renderMathHtml` / `renderTex`; client preview lazy-loads KaTeX | `lib/math.ts`, `components/problem/math-html.tsx`, `answer-input.tsx` |
| Spoiler withholding | Client gets `toSolveProblem` (allowlist). Answer, tags, subtopic, source heading stay server-side until submit. Tab title is the citation. | `lib/problem.ts`, `app/(app)/solve/actions.ts` |
| Grading | Choice / numeric / expression / free-response / skip | `lib/grade.ts` via server action `submitAnswer` |
| Solve surface | Split panes, notes, timer, flag UI, shortcuts, inline feedback + error-kind chips | `components/solve/` |
| Dashboard layout | Recent ribbon + list (left); profile snapshot, compact filters, upload dropzone (right) | `app/(app)/dashboard/page.tsx` |
| Profile analytics | Range `?range=7d\|30d\|all`; trend, mastery grid, error breakdown, time histogram, weak spots, review list, sessions, textbooks | `app/(app)/profile/page.tsx`, `components/profile/` |
| 404 | Custom `app/not-found.tsx` | |
| Dashboard loading/error | Skeleton + error boundary | `dashboard/loading.tsx`, `dashboard/error.tsx` |
| Solve problem loading | Skeleton matching two-pane layout | `solve/[problemId]/loading.tsx` |

**Product decisions already made (do not silently reverse):**

- Analytics live on **Profile**, not Dashboard. Dashboard is a launcher.
- Filters live on **Dashboard**. Do not recreate `/queue`.
- Dark is the default theme. Tokens: `--ink` / `--surface` / `--accent` / `--ember` / `--flag`. Shape lock: 12 / 8 / 4 / pill-chips-only.
- `toSolveProblem` **lists allowed fields**. Adding a secret to `Problem` must not automatically ship it to the client.
- Empty status filter means `PRACTICE_STATUSES` (unattempted, missed, flagged, in-progress), not “match nothing.”
- Facet counts ignore the group being counted.
- Lifetime stats on the dashboard vs 30-day stats on the profile are **supposed** to disagree.

---

### Partial — UI exists, data does not stick

| Feature | Current behaviour | Gap |
| --- | --- | --- |
| `submitAnswer` | Grades and returns HTML + tags | Does **not** append an `Attempt`, change `Problem.status`, or revalidate dashboard/profile |
| Flag (`F` / icon) | React state on `SolveSurface`, seeded from `problem.status` | Lost on navigation; never written to the mock API |
| Error-kind chips | Client state after a miss | Never sent to the server; profile “Where it goes wrong” is 100% generated history |
| Notes pad | `localStorage` key `margin-notes-${problemId}` | Not associated with a user or attempt |
| Pane split | `localStorage` key `margin-solve-split` | Fine as-is |
| Theme | `localStorage` key `margin-theme` | Fine as-is; no Settings page |
| Upload dropzone | Drag/pick `image/*` + PDF; lists filenames in component state | Files are not uploaded, stored, OCR’d, or classified. Copy says so. |
| `/upload` | Stub empty state | Dead route; real UI is the dashboard panel |
| `/scratch` | Design-token gallery | Dev leftover; not in the primary nav |
| Problem `status` on fixtures | Static (`unattempted` / `missed` / `flagged` / `mastered`) | Not derived from attempts; queue and “mastered” counts will disagree with a live session until persistence exists |
| Loading/error | Only dashboard has `error.tsx`; profile and `/solve` landing have no `loading.tsx` | Add when those pages get slower data |

---

### Still to add

Build these against the types and screens that already exist. Do not add a fourth primary page, do not resurrect `/queue`, and do not move analytics off Profile.

#### 1. Live attempts (do this first)

The product currently *displays* history it never *records*. `submitAnswer` in `app/(app)/solve/actions.ts` returns a grade and stops. The in-memory `attempts` array in `lib/mock/api.ts` is filled once at module load by `buildAttempts()` and then treated as read-only.

What to add:

- Accept `seconds` and optional `errorKind` from the client (the timer and the error chips already live on `SolveSurface`; they are just not sent).
- After grading, append an `Attempt` (`lib/types.ts`: id, problemId, outcome, errorKind?, submittedAnswer, seconds, at, topicId, difficulty).
- Keep that list in a mutable store the existing getters already read (`getDashboard`, `getAnalytics`, `getStreak`, `sessionSummaries`). A module-level array is enough until a database lands.
- Revalidate or `router.refresh()` so the dashboard ribbon, “recently solved,” lifetime stats, and profile charts move without a full reload.
- For proofs: the first response is `partial` + `selfGraded`. A second call (or a small `confirmGrade` action) must overwrite that attempt when the student taps “I got this” / “I missed it.” Right now those buttons only change React state.
- Use a real timestamp for *new* rows. Keep `REFERENCE_DATE` only for the seeded backfill so historical charts stay stable.

Done when: submit a wrong numeric answer, reload `/dashboard`, and see a new ember tick and a new row; open Profile and see attempted +1.

#### 2. Problem status that follows attempts

Fixture `status` is static. The queue still offers a problem you just mastered, and the snapshot’s “3 mastered” never increments.

Derive status from attempts (suggestion, not implemented):

| Condition | Status |
| --- | --- |
| Flagged by the student | `flagged` (keep even after a later correct) |
| Latest scored attempt correct, and not flagged | `mastered` |
| Latest scored attempt incorrect / partial | `missed` |
| Opened or notes saved, never submitted | `in-progress` (optional) |
| No attempts | `unattempted` |

`getQueue` already filters on `status`. Once this is live, default practice (`PRACTICE_STATUSES`) will naturally skip mastered items.

#### 3. Flags and error kinds on the server

- Flag: today `setFlagged` is local. Add `flagProblem(id, flagged)` (or persist on submit) so a flagged problem stays flagged in the queue and on the next visit.
- Error kind: require it before leaving a miss (the UI already asks). Store it on the `Attempt`. Profile “Where it goes wrong” should mix seeded history with live marks, not ignore the live ones.

#### 4. Upload that creates problems

Dashboard `UploadPanel` is a filename list in `useState`. Need:

- Store the file (local disk or object storage).
- Parse a photo/PDF of a chapter into candidate problems (OCR / vision / whatever the backend will be).
- A **review step** before they enter the library: body (LaTeX), source (book, chapter, number), proposed topic / kind / difficulty / tags / answer. The student must be able to edit a bad classification. This is the real `/upload` page — replace the stub rather than inventing a fourth nav item.
- Insert `Problem` rows into the same store `getQueue` reads. New problems should appear in filters immediately.
- Keep the spoiler rule: classification is ours; do not put tags in any pre-submit client payload.

Until this exists, the dropzone copy must keep saying files are queued locally only.

#### 5. Auth and a real user

One hardcoded `UserProfile`. Need sign-up / sign-in, a real `userId` on attempts and textbooks, and isolation so two people do not share Priya’s ribbon. Onboarding can be thin: name, course, first textbook. Do not add a marketing site; `/` should keep redirecting to `/dashboard` once logged in (or to a login screen).

Swap `lib/mock/api.ts` for implementations with the **same async signatures** (`getDashboard`, `getQueue`, `getProblem`, `getAnalytics`, `getProfileData`, `getStreak`) so pages do not get rewritten.

#### 6. Database

No ORM, no migrations, no `.env` connection. When you add one, persist: users, textbooks, problems, attempts, flags, notes (today notes are `localStorage` only). Seed or import the 16 fixtures so the UI has something to show in development.

#### 7. Worked solutions

`Problem.workedSolution` is on the type and almost unused. After submit, optionally reveal a step-by-step writeup under the answer — still server-rendered, still withheld until commit. Do not show it on the dashboard or in problem lists.

#### 8. Tests

There is no test runner script beyond `lint`. Add tests before the grader or queue parser get cleverer:

- `gradeAnswer`: `2/15` ≡ `0.1333`, `+ C` optional, choice ids, numeric tolerance, empty → skipped, free-response → self-graded.
- `parseQueueSpec` / `queueQuery`: comma-separated multi values, invalid `d` dropped, empty status → `PRACTICE_STATUSES`.
- `toSolveProblem`: returned object has no `answer`, `tags`, `subtopic`, or `source`.

#### 9. Settings (small)

Theme toggle is enough for colour. Still missing, if wanted later: default filter preset, “end session after N problems,” account/course edit, delete-my-data. Do **not** add a “show tags while solving” setting that undoes the spoiler rule.

#### 10. Housekeeping (do not treat as features)

- Redirect `/upload` → `/dashboard` or replace it with the review step in (4).
- Delete `/scratch` once nobody is checking tokens there.
- `error.tsx` / `loading.tsx` on profile and `/solve` when those pages hit a real network.
- Empty dashboard/profile for a brand-new account (all current empty states exist but are never shown, because the mock history is always full).

#### 11. Out of scope unless asked

A public marketing landing page, social/sharing, spaced-repetition algorithms beyond “missed more than once,” live multiplayer, a native app, and a second navigation model. The three pages are the product.

---

### What to do next (recommended order)

1. Record attempts (section 1) — this unblocks everything that looks “dead” after you solve.
2. Derive problem status (2) and persist flags / error kinds (3).
3. Tests for grader + queue (8).
4. Real upload + classification review (4); retire the `/upload` stub.
5. Auth + database (5–6), keeping the mock API’s function shapes.
6. Worked solutions (7) and empty-account states (10).
7. Remove `/scratch`.

When adding fields to `Problem`, update `toSolveProblem` / `SolveProblem` deliberately. Prefer withholding.

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

---

## Stack

Next.js 16 (App Router), React 19, Tailwind v4, KaTeX, Motion, Phosphor icons. TypeScript throughout. The mock API in `lib/mock/` is shaped like the real one will be — async functions returning the same types — so the screens do not have to be rewritten when a database arrives.

```
app/(app)/          dashboard · solve · profile
components/         ui primitives, then dashboard / solve / profile / shell
lib/mock/           fixtures + seeded history
lib/grade.ts        marking
lib/math.ts         server-side KaTeX
lib/queue.ts        URL spec for a session
```

---

Margin, in the typesetting sense: the space beside the problem where the work actually happens.
