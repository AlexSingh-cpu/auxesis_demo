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

## What this prototype is, and is not

The library is sixteen classified problems across Stewart, Axler, and Ross, plus ~70 days of seeded attempt history for one student (Priya Raghunathan, Calculus II). Filtering, session continuity, KaTeX, grading, spoiler withholding, notes, theme, and the analytics charts all run against that mock.

**Wired, but local only**

- The upload dropzone accepts files and lists them. Nothing is parsed or classified.
- Flagging a problem is visual. It is not written back.
- Error-kind chips are collected on the solve screen. They do not yet update the profile.

**Not built**

Accounts, a database, OCR of a photographed chapter, attempts that change your stats. Answering a problem today does not move the ribbon.

The leftover `/upload` route is a stub. The working dropzone is on the dashboard. `/scratch` is the design-system gallery used while the tokens were being locked.

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
