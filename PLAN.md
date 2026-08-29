# Margin — Frontend Completion Plan

Written 2026-08-26 as a planning pass. **Status updated 2026-08-27** — steps 1–5
and engagement items 1–5 and 7 have shipped since; each is marked below with its
commit. **§3b added 2026-08-28**: the next phase, drafted and approved. Sections 1–2 describe the codebase as it was *before* that work and are
kept as the historical baseline; `OVERVIEW.md` is the current-state snapshot.

Scope: finish the **frontend**. Backend work (auth, a real database, OCR/vision
parsing, multi-user isolation) is catalogued at the end and deliberately
deferred. Where this plan touches the data layer it does so through the mock
API's existing async signatures, so a real backend can replace it later without
rewriting screens.

---

## 0. Status at a glance

| Track | Done | Remaining |
| --- | --- | --- |
| **Core plan** (§3) | 1 · 2 · 3 · 4 · 5 | **6** upload review · **7** empty states · **8** consistency polish |
| **Engagement** (§3a) | 1 · 2 · 3 · 4 · 5 · 7 | **6** staged reveal · **8** timer toggle · **9** mobile notes · **10** session recap |
| **Backend** (§4) | — | auth · database · real ingestion · worked solutions |

**Gates, all currently green:** `npx tsc --noEmit`, `npm run lint`, `npm test`
(39 tests, 4 files), plus `npm run build` succeeds.

**What changed structurally.** The app no longer "displays history it never
records" — that was the central finding of both the original plan and the
engagement analysis, and it is resolved. Submitting, flagging, skipping, and
self-diagnosing a miss all persist; `Problem.status` is derived from real
attempt history. What remains is mostly *surface*: the two biggest open items
(§3a items 6 and 10) are both about the app having no emotional peak and no
ending, which is the one structural finding from `ENGAGEMENT_ANALYSIS.md` still
entirely untouched.

**The next phase is §3b, "the session has an ending"** — engagement items 10,
6, 8, and 9 plus the step 8 polish, drafted and approved 2026-08-28. It leads
with the session recap, which was gated on attempt persistence, and that now
exists; `ENGAGEMENT_ANALYSIS.md` §3.2 rates it the highest single-item impact
in the document. Step 6 (upload review) is deliberately *not* next: it is the
larger screen, but shipping it first would leave the session still ending on a
bare navigation event.

---

## 1. Architecture as built

**Stack:** Next.js 16.3.2 (App Router), React 19.2.8, Tailwind v4, TypeScript
strict, KaTeX, Motion, Phosphor icons. Verified: `tsc --noEmit` and `eslint`
both exit 0 on the current tree.

Tailwind v4 is configured CSS-first in `app/globals.css` via `@theme inline` —
there is no `tailwind.config.js` and there should not be one. Next 16 APIs
differ from older versions; `node_modules/next/dist/docs/` is the reference, per
`AGENTS.md`.

### Route structure

```
app/
  layout.tsx              fonts, metadata template, no-flash theme script
  page.tsx                redirect → /dashboard
  not-found.tsx           custom 404
  (app)/
    layout.tsx            TopBar + main + MobileTabBar
    dashboard/            page · loading · error
    solve/
      page.tsx            entry point: redirects to first match, else empty state
      [problemId]/        page · loading
      actions.ts          "use server" — submitAnswer
    profile/page.tsx      no loading, no error
    upload/page.tsx       stub; dead route
  scratch/                design-token gallery; dev leftover, still ships
```

### How the pieces fit

- **Server Components fetch; Client Components interact.** Pages are async
  server components pulling from `lib/mock/api.ts`. Only genuinely interactive
  leaves carry `"use client"` — the filters, solve surface, notes pad, timer,
  theme toggle, nav.
- **The URL is the session state.** `lib/queue.ts` defines a five-key spec
  (`book`, `topic`, `d`, `kind`, `status`) parsed by `parseQueueSpec` and
  re-serialized by `queueQuery`. This is what carries filters from dashboard
  into solve and back. An empty status filter deliberately means
  `PRACTICE_STATUSES`, not "match nothing".
- **The spoiler boundary is real, not decorative.** `toSolveProblem`
  (`lib/problem.ts`) is a hand-written allowlist, so a new field on `Problem` is
  withheld by default. Grading runs in a server action, so the answer key never
  reaches the browser pre-submit. The tab title is the citation, never the
  subtopic.
- **Design system.** Tokens in `globals.css`, a shape lock (surfaces 12,
  controls 8, micro 4, chips the only pill), a documented z-index scale
  (10/20/30/40/50), `prefers-reduced-motion` honoured globally, and a theme
  script that runs during HTML parse so light mode never flashes.

### Data layer

`lib/mock/api.ts` generates ~70 days of attempts at module load with a seeded
`mulberry32(20260825)` PRNG anchored to `REFERENCE_DATE = 2026-08-25T04:00Z`.
Per-topic latent `ABILITY` values keep the trend, mastery grid, and weak spots
telling a consistent story. The array is then treated as read-only.

---

## 2. Current state

### Works

Three pages render real seeded data end to end. Faceted filter counts that
ignore the group being counted. KaTeX server rendering plus a lazy-loaded client
preview. Grading across all four answer formats. Resizable split panes with a
persisted divider. Dark/light theme. Custom 404. Skeletons that mirror the
layouts they replace.

### Partial — the central problem

**The product displays history it never records.** `submitAnswer` grades and
returns; it does not append an `Attempt`, change `Problem.status`, or revalidate
anything. Consequences, all currently live:

| Thing | Why it never moves |
| --- | --- |
| Dashboard ribbon and "recently solved" | No attempt is written |
| Profile charts | 100% generated history; your live answers are invisible |
| Flag (`F`) | `useState` on `SolveSurface`, lost on navigation |
| Error-kind chips | Client state, never sent to the server |
| `Problem.status` | Static on fixtures; the queue re-offers what you just mastered |

### Confirmed defects

These were found by reading the code, not inferred from the README.

1. **Duplicate DOM in the solve surface.** `components/solve/solve-surface.tsx`
   builds `problemPane` / `answerPane` as JSX variables and renders them into
   *both* the desktop grid (line 202, `hidden lg:grid`) and the mobile block
   (line 252, `lg:hidden`). Both containers are always in the DOM — only CSS
   hides one. Results:
   - Two elements with `id="answer"` and two with `id="solve-notes"`, so every
     `<label htmlFor>` binds to whichever the parser hit first.
   - Two radio groups sharing `name="answer"`, which the HTML spec scopes to the
     whole document when there is no form ancestor.
   - Two `NotesPad` instances autosaving to the same `localStorage` key. Each is
     uncontrolled and hydrates only on mount, so they drift apart and the last
     debounce to fire wins.
2. **Elapsed time cannot be read.** `components/solve/timer.tsx` keeps `seconds`
   in internal state with no callback, ref, or lifted state. Recording attempt
   duration is impossible until this is changed.
3. **Skip records nothing.** The Skip button (`solve-surface.tsx:282`) calls
   `goNext()` directly. `gradeAnswer` already returns `"skipped"` for empty
   input, so the grading path exists and is simply unused.
4. **Shortcut dialog is not a dialog.** `ShortcutSheet` has `role="dialog"` and
   `aria-modal` but no focus trap, no initial focus, and no focus restore on
   close. Background shortcuts (`N`, `F`) still fire while it is open.
5. **Recent-solved links drop filters.** `components/dashboard/recent-solved.tsx`
   links to `/solve/${problemId}` with no query string, silently discarding the
   session spec that the rest of the app works hard to preserve.
6. **Missing boundaries.** Profile and `/solve` have neither `loading.tsx` nor
   `error.tsx`. There is no root `app/error.tsx` or `global-error.tsx`.

### Missing outright

Attempt persistence · problem status derived from attempts · the upload review
step · reachable new-account empty states · any test runner.

---

## 3. Prioritized plan

Ordered by dependency, not by size. Each step states why it is where it is.

### 1. Repair the solve surface — done (`c475c28`)

*Rationale: a prerequisite for everything else — step 3 cannot send elapsed time
until the timer exposes it, and duplicate IDs make any UI test unreliable.*

- Render `problemPane` / `answerPane` **once**. Either drive layout from a single
  tree whose classes change at the `lg` breakpoint, or gate the mobile branch on
  a `useMediaQuery` so only one subtree mounts. Prefer the CSS-only fix; it
  keeps SSR output stable and avoids a hydration flash.
- Make `AnswerInput` and `NotesPad` take an `idPrefix` (or use React's
  `useId`) so no id is hardcoded, even if a second instance ever returns.
- Lift the timer: `Timer` accepts `onTick` or forwards a ref exposing
  `getSeconds()`. Keep the per-second re-render isolated to the `Timer` — that
  isolation is deliberate and worth preserving.
- Give `ShortcutSheet` focus management: focus the dialog on open, trap Tab
  inside it, restore focus to the trigger on close, and suppress `N` / `F` while
  it is open.

### 2. Add Vitest and cover the pure logic — done (`4ceab3c`)

*Rationale: a cheap safety net installed before step 3 touches the data layer.
The spoiler rule is the product's core promise and has no guard at all today.*

- Add Vitest with a `test` script. Logic only — no browser, no component tests
  this phase.
- `gradeAnswer`: `2/15` ≡ `0.1333`, trailing `+ C` ignored, choice ids, numeric
  tolerance boundaries, empty → `skipped`, free-response → `partial` +
  `selfGraded`.
- `parseQueueSpec` / `queueQuery`: comma-separated multi-values, invalid `d`
  dropped, empty status → `PRACTICE_STATUSES`, unrelated params never serialized.
- `toSolveProblem`: assert the returned object has no `answer`,
  `acceptedAnswers`, `workedSolution`, `tags`, `subtopic`, or `source`. Write
  this as a key-set assertion so a newly added secret field fails the test.

### 3. Record attempts — done (`92b7abe`)

*Rationale: the single change that makes the app feel finished. Everything that
currently looks dead after you solve is downstream of this.*

- Move the seeded array into a mutable module-level store the existing getters
  already read. Keep `getDashboard`, `getQueue`, `getProblem`, `getAnalytics`,
  `getProfileData`, and `getStreak` signatures **unchanged**.
- Extend `submitAnswer` to accept `seconds` and append an `Attempt` after
  grading. `errorKind` turned out not to belong on this call: the chip that
  sets it only appears in the feedback panel *after* `submitAnswer` returns,
  so there was nothing to pass yet. Its persistence stays step 4's job.
- Revalidate `/dashboard` and `/profile` so the ribbon, recent list, lifetime
  stats, and charts update without a hard reload.
- Proofs need a second write: the first response is `partial` + `selfGraded`,
  and "I got this" / "I missed it" must overwrite that attempt via a small
  `confirmGrade` action rather than only changing React state.
- Resolved in passing, because it broke the "done when" check below: the mock
  clock split flagged in Risks. A live attempt stamped with the real wall
  clock would count toward `attempted` in every windowed range (no upper
  bound on the filter) but never extend the streak (`computeStreak` walks
  backward from `REFERENCE_DATE` and never looks forward past it) — so
  answering correctly today wouldn't show up as a longer streak. Fixed with
  a `now()` in `lib/mock/api.ts` that ticks forward from real elapsed time
  but is offset to start at `REFERENCE_DATE`, so live attempts land on the
  same mock "today" every other calculation already assumes. `buildAttempts`
  keeps using the raw `REFERENCE_DATE` instant, so historical charts still
  never drift.

**Done when:** submit a wrong numeric answer, return to `/dashboard`, and see a
new ember tick plus a new row; open Profile and see attempted increment.
Verified via `lib/mock/api.test.ts` against the real store (not mocked) —
browser-level click-through wasn't possible in this environment (no browser
automation tool available), so that remains a manual check before shipping.

### 4. Persist flags, error kinds, and skips — done (`679c5c4`)

*Rationale: completes the diagnostic loop the entire Profile page is built to
display. Without it, "Where it goes wrong" ignores everything you actually mark.*

- `flagProblem(id, flagged)` so a flag survives navigation and keeps the problem
  in the queue.
- **Amended by `ENGAGEMENT_ANALYSIS.md` §5.3 — do not hard-require the error
  kind inline.** The original plan was to gate advance on classifying a miss.
  Kept it one-tap and optional inline, `Enter` still advances without it. Did
  **not** wait for the session recap to exist before persisting it, though:
  `setAttemptErrorKind` writes it to the attempt as soon as the chip is
  picked, since the recap (engagement item #10) isn't built yet and gating a
  real diagnostic feature on unbuilt future work wasn't worth it. Same
  outcome either way — the data lands on the attempt — just immediately
  instead of batched.
- Route Skip through `submitAnswer` with an empty answer so it records a
  `skipped` attempt. Fire-and-forget, not awaited — skip must feel instant
  and must not reveal the answer. The `N` shortcut goes through the same
  path now; it was already an alias for the Skip button under a different
  trigger.
- Derive `Problem.status` from attempts (flagged wins; else latest scored
  attempt correct → mastered, incorrect/partial → missed; no attempts →
  unattempted). This is what stops the queue re-offering a problem you just
  mastered. Applied where `Problem` objects leave `lib/mock/api.ts`
  (`getProblem`, `getQueue`) and where `getDashboard` counts by status, so
  every consumer (`toSolveProblem`, `toQueuedProblem`, dashboard facet
  counts) picks it up with no changes of its own.

### 5. Fill in missing states and routes — done (`b71f1d3`)

*Rationale: small, independent, and removes the last obviously-unfinished edges.*

- `loading.tsx` and `error.tsx` for Profile; `loading.tsx` for `/solve`.
- A root `error.tsx` so an unhandled error is not a blank page. Catches
  everything under `(app)/` without its own nested boundary; does not catch
  errors in the root layout itself (`global-error.tsx` territory, not
  warranted here).
- Chose the guard over deletion for `/scratch` — `notFound()` when
  `NODE_ENV === "production"`. It is a genuinely useful 420-line design-token
  reference, not dead weight; the goal was keeping it out of production, not
  losing it. Verified with a real `next build` + `next start`, not just by
  inspection: `/scratch` 404s in production, still serves in dev.

### 6. Build the upload review step

*Rationale: the largest genuinely-missing screen, and the only place the product
promise ("add problems from your own textbooks") is currently unmet.*

- Replace `app/(app)/upload/page.tsx` with the real review UI. Do **not** add a
  fourth nav item — the dashboard dropzone routes into it.
- A fake parser turns an uploaded file into candidate problems, so the flow is
  walkable without OCR.
- Each candidate is editable: body (LaTeX, with live preview), source
  (book / chapter / number), topic, kind, difficulty, tags, answer format, and
  answer. Bad classifications must be correctable before anything is accepted.
- Accepted problems insert into the same store `getQueue` reads, so they appear
  in the filters immediately.
- Keep the spoiler rule: classification data is ours, and none of it belongs in
  a pre-submit client payload.
- Harden the dropzone while here: file-type validation, a size cap, and visible
  per-file error states.

### 7. Make new-account empty states reachable

*Rationale: they are already written and currently unreachable, so they are
untested and will first be seen by a real new user.*

- A way to run against an empty store (a seed flag or a fixtures toggle), then
  verify the dashboard, profile, and solve empty states actually render.
- Guard the analytics maths against division by zero on an empty history.

### 8. Consistency polish

*Rationale: small correctness wins, safe to do last.*

- `RecentSolved` should preserve the queue query in its links.
- `hasActiveFilters` / the filters' `anyActive` check counts *any* search param;
  scope both to `QUEUE_KEYS` so an unrelated param never reads as a filter.
- Resolve the mock-clock split described under Risks.

---

## 3a. Engagement phase — from `ENGAGEMENT_ANALYSIS.md`

Full reasoning and citations for each item live in `ENGAGEMENT_ANALYSIS.md`
(written 2026-08-26 from a read of the shipped components, not the README).
This is the top-10 list from that document, sequenced against the plan above.
Two structural findings drove it: every form of user investment (attempts,
flags, error-kind self-diagnosis, notes) currently evaporates because nothing
persists, and the app has no emotional peak or ending, so a well-crafted
experience reads as flat in retrospect. Gamification mechanics that would
contradict the product's "diagnostic, not trophy case" philosophy (XP, levels,
badges, leaderboards, streak-shaming) were explicitly considered and rejected.

### Done

| # | Change | Shipped in |
| --- | --- | --- |
| 1 | Zero-decision start path: an always-enabled "Start practice" bar above the filter panel, filters demoted to "Or, choose what to work on" | `7811ff6` |
| 2 | Surface `queuedCount` on the dashboard — it was computed on every load and rendered nowhere | `7811ff6` |
| 3 | Name the spoiler rule in the UI, near the citation on solve, for the first few problems only | `7811ff6` |
| 4 | Three copy fixes so the app stops talking about itself ("your analytics", "the backend") at moments it should be talking to the student | `7811ff6` |
| 5 | Streak visible below the `lg` breakpoint, abbreviated to fit the mobile header | `7811ff6` |
| 7 | Don't hard-require the error kind inline — kept one-tap and optional, `Enter` still advances without it | `679c5c4` |

Item 7 landed as *immediate* persistence on pick rather than batching into the
recap, since the recap didn't exist yet and gating a real diagnostic feature on
unbuilt future work wasn't worth it. Same data on the attempt either way.

### Remaining

| # | Change | Effort | Rationale |
| --- | --- | --- | --- |
| 10 | **Session recap** at queue completion: attempted, correct, median time, this-session ribbon, one derived next action, and a prompt for any miss still missing an error kind (some will, since the chip stays optional) | ~half day | Highest single-item impact in the analysis. "Finish" is still a bare navigation event — the most heavily weighted moment of the experience (peak-end rule) is nothing at all. **Was gated on step 3; that shipped, so this is now unblocked.** |
| 6 | Stage the feedback reveal (outcome → answer → classification, ~120ms stagger) and mark a correct difficulty 4–5 answer distinctly (accent border, firmer spring) | ~1–2 h | Creates the app's only *other* emotional peak. The classification reveal is the one genuine variable reward and still renders as a flat metadata footer. |
| 9 | Keep a condensed, collapsible problem statement visible in the mobile Notes tab (`solve-surface.tsx` hides it when `tab === "notes"`) | ~1 h | Notes are manipulation of the problem; hiding the source adds working-memory load exactly when the user is trying to offload it. |
| 8 | Timer hide toggle, persisted next to `margin-solve-split` | ~45 min | Keep recording elapsed time; make displaying it optional. A count-up clock with no reference point can only make the user feel slow, and blocks flow on hard problems. |

Reordered against the original list: 10 moved to the front now that its
dependency has shipped, and it and 6 together are the whole of the "nothing is
marked" structural finding. **All four remaining items are sequenced and
specified in §3b**, together with the step 8 polish.

**Also noted, not itemized (see `ENGAGEMENT_ANALYSIS.md` for detail):**
a starter problem set so new accounts don't land on a disabled primary button
(§1.1 — overlaps step 7 above); spaced-repetition due dates over the existing
`readyToReview` data (§7.1) — the one mechanic where user retention and material
retention are the same thing; an opt-in, self-scheduled daily reminder and
exam-date awareness (§2.1, §7.2); an inline competence signal after submit
(§4.2); the three *other* dashboard fields still computed and discarded —
`summary`, `weakSpots`, `sessions` (§3.3, only `queuedCount` was surfaced).

---

## 3b. Next phase — "the session has an ending"

Drafted and approved 2026-08-28, after steps 1–5 and engagement items 1–5 and 7.
Scope: engagement items **10**, **6**, **8**, **9**, plus the **step 8** polish.
Ordered so the anchor lands first — item 10 introduces the session concept the
rest of the phase leans on; item 6 is the other emotional peak and touches
`Feedback` alone; items 8 and 9 are independent and small; step 8 is unrelated
correctness debt and must not block a feature.

Everything below was grounded in a read of the shipped components, with file
and line references given where a claim depends on current code.

### 1. Session recap (item 10) — ~half a day

*Rationale: "Finish" is currently `dashboardHref(params)`
(`app/(app)/solve/[problemId]/page.tsx:47`) — a bare navigation event at the
most heavily weighted moment of the experience. Highest single-item impact in
`ENGAGEMENT_ANALYSIS.md` §3.2, and unblocked since step 3 shipped.*

- **New route** `app/(app)/solve/recap/page.tsx`, a server component reading the
  same queue spec from the URL, with a `loading.tsx` to match the sibling
  routes. Static segments take precedence over dynamic ones in the App Router,
  so `recap` is not shadowed by `[problemId]`; problem ids are prefixed, so no
  id can collide with the literal string.
- **`nextHref` becomes `recapHref(params)`** when `hasNext` is false. The button
  keeps reading "Finish".
- **Contents**, all derivable from fields already on `Attempt`: attempted,
  correct, accuracy, median `seconds`, a this-session `AttemptRibbon` (reusing
  `components/dashboard/attempt-ribbon.tsx`), and one derived next action — the
  session's weakest topic, linked back into `/solve` with that topic filter
  applied.
- **Prompt for unclassified misses.** Item 7 deliberately kept the error-kind
  chip optional inline, so some misses arrive here unclassified. The recap lists
  exactly those and offers the same four chips, writing through the existing
  `setAttemptErrorKind` action. This is the payoff for having kept it optional.
- **New `getSessionRecap(spec)`** in `lib/mock/api.ts`, matching the async shape
  of its neighbours so a real backend can replace it unchanged.

**Session boundary — decided: a gap heuristic.** `SessionSummary`
(`lib/types.ts:135`) is day-grained and cannot serve here. The recap selects
live attempts back to the most recent gap longer than 30 minutes. This needs no
new field on `Attempt`, no cookie, and survives a reload — and it sidesteps the
fact that a server component cannot write a cookie during render. The rejected
alternative was an explicit session id stamped at `/solve` entry: more precise,
and the only option that correctly separates two back-to-back queues, but it
costs a field on `Attempt` plus a server action fired on mount purely to start
the clock. Revisit it alongside auth, where sessions become real.

### 2. Staged feedback reveal (item 6) — ~1–2 h

*Rationale: `Feedback` springs in as one block, so the classification tags — the
app's only genuine variable reward — arrive as a flat metadata footer.*

- Split the single `motion.div` into three staggered children at ~120ms:
  outcome badge → answer/reference → classification.
- Mark a correct answer at difficulty 4–5 distinctly (accent border, firmer
  spring). `problem.difficulty` is already in scope at the call site.
- **Resolves the reduced-motion open question in §5.** `Feedback` already calls
  `useReducedMotion()` *and* the global CSS rule kills durations; staggering is
  where those two mechanisms would actually conflict. With `reduce` true the
  stagger collapses to zero — everything at once, no partial reveal.

### 3. Timer visibility toggle (item 8) — ~45 min

*Rationale: a count-up clock with no reference point can only make the user feel
slow, and blocks flow on hard problems. Keep recording; make displaying it
optional.*

- `Timer` keeps `secondsRef` independent of render
  (`components/solve/timer.tsx`), so hiding the display is genuinely cosmetic —
  elapsed time still reaches `submitAnswer` untouched.
- Toggle in the action bar, persisted to `localStorage` under
  `margin-timer-hidden`, alongside the existing `margin-solve-split`.
- Hidden means visually hidden only; the `aria-label` stays, so the value
  remains available to a screen reader on request.

### 4. Condensed problem in the mobile Notes tab (item 9) — ~1 h

*Rationale: `solve-surface.tsx` hides the problem section entirely when
`tab === "notes"`, adding working-memory load exactly when the user is trying to
offload it.*

- A collapsible condensed statement above `NotesPad`, `lg:hidden`, collapsed by
  default with the citation always visible. Reuses the same `bodyHtml`, so there
  is no second `MathHtml` mount cost beyond the markup and no change to the
  spoiler boundary.

### 5. Step 8 consistency polish — ~1 h

- Route `RecentSolved` links through `solveHref` so they stop dropping the queue
  query (`components/dashboard/recent-solved.tsx`).
- Scope `hasActiveFilters` and the filters' `anyActive` check to `QUEUE_KEYS`, so
  an unrelated search param never reads as a filter. Gets a unit test.
- The mock-clock split is already resolved for live attempts in `92b7abe`; close
  the item by updating the §5 note rather than reopening the design.

### Testing and gates

Vitest stays logic-only, per the phase scope: cover `getSessionRecap`'s boundary
selection (including the empty-session case) and the `QUEUE_KEYS` scoping. The
visual items — stagger, toggle, collapsible — have no logic worth unit-testing
and get manual verification. Gates unchanged: `npx tsc --noEmit`,
`npm run lint`, `npm test`, `npm run build`.

---

## 4. Backend work — deferred

Noted, not planned here.

- **Auth and real users.** One hardcoded `UserProfile`. Needs sign-in, a real
  `userId` on attempts and textbooks, and isolation between accounts.
- **Database.** No ORM, migrations, or connection. Would persist users,
  textbooks, problems, attempts, flags, and notes (notes are `localStorage` only
  today). Swap `lib/mock/api.ts` for implementations with identical async
  signatures.
- **Real ingestion.** File storage plus OCR/vision to turn a photo or PDF of a
  chapter into candidate problems, feeding the step-6 review UI.
- **Worked solutions.** `Problem.workedSolution` exists on the type and is
  effectively unused; revealing it post-submit is a small feature once content
  exists.

---

## 5. Risks, inconsistencies, and open questions

**The mock clock split — resolved for live attempts, in `92b7abe`.** `lib/mock/api.ts`
now exports `now()`: real elapsed time since the module loaded, offset to start
at `REFERENCE_DATE`. Live attempts are stamped with it, `getMockNow()` exposes
it to the dashboard's `RecentSolved`, and `buildAttempts`' seeded backfill still
uses the raw `REFERENCE_DATE` instant untouched. This picked the "stay pinned"
side of the open question below — deliberately, since a session running for
minutes to hours never crosses a day boundary, so every `REFERENCE_DATE`-anchored
range/streak calculation stays correct with zero changes to that math, and
historical charts still never drift between renders. The bigger question is
still open, just smaller now: **once a dev server has been up for a full day**,
`now()` will cross into "tomorrow" relative to `REFERENCE_DATE`, at which point
live attempts start landing on a mock day the seeded history never reaches.
Harmless for a dev/demo session; would need real revisiting alongside step 6
(auth/database), where "now" should just be real time and this whole shim goes
away.

**`topicId` reaches the client pre-submit.** `toSolveProblem` includes it. Topic
is coarser than subtopic, so this is defensible, but it is a small crack in an
otherwise strict rule — the client knows a problem is "integration" before you
answer. Worth an explicit decision rather than leaving it implicit.

**Fixture counts and derived status will disagree.** `Textbook.solvedCount` and
`problemCount` are static fixture values, and the mock generator assigns attempts
to random problems. Once status is derived (step 4), the Profile's textbook
column can contradict the real tally. Either derive those counts too or label
them as fixture data.

**Sixteen problems is a thin library.** Filter combinations frequently land on
zero matches, which makes the faceted counts hard to evaluate and the disabled
"Start practice" state the common case rather than the edge case. Consider
expanding the fixtures while building step 6.

**Dashboard fixed-height layout.** The dashboard is `lg:h-[calc(100dvh-6rem)]`
with `overflow-hidden` to fit one screen. It is worth checking at 1280×720 and
at 150% browser zoom, where the filter panel and dropzone may be squeezed.

**Open question — reduced motion.** The global `prefers-reduced-motion` rule
kills animation *durations* via CSS, and `Feedback` additionally checks
`useReducedMotion()`. Confirm the two mechanisms do not fight, particularly for
the spring transition on the feedback reveal.
