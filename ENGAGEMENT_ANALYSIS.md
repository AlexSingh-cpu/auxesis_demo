# Margin — Psychological & Behavioral Design Analysis

Written 2026-08-26, from a full read of the shipped components, page flows, and
copy. Every finding cites the file it came from. No code was changed to produce
this document.

## The honest framing

Margin is a **deliberately anti-gamified** product. The README states it: the
Profile is "the diagnostic, not the trophy case." The visual system is an
engineering notebook. The copy is precise and unsentimental. Analysis that
recommended XP bars, badges, and leaderboards would be recommending a different
product.

So this document holds two standards at once:

1. Where the app is trying to be calm and diagnostic, does it *succeed* — or is
   it merely austere in places where a human would want acknowledgement?
2. Where behavioral mechanics genuinely serve the student's own goal (learning
   the material, not returning to the app), are they present?

The finding that dominates everything below: **the app's entire investment
layer currently evaporates on navigation.** That is not primarily an engagement
problem, it is the persistence gap already documented as step 3 of `PLAN.md`.
But it has severe behavioral consequences, and they are worth naming precisely,
because they change what to build *around* persistence once it lands.

---

## 1. First impressions & onboarding

### 1.1 There is no onboarding at all, and the cold start is a dead end

**What's happening.** `app/page.tsx` is a bare `redirect("/dashboard")`. There
is no landing page, no sign-up, no first-run experience. Today a visitor lands
directly in Priya Raghunathan's fully-populated account
(`lib/mock/fixtures.ts:8`), which conceals the problem. Trace what a *genuine*
new user would see once auth exists and the fixtures are theirs:

- Attempt ribbon: empty
- "Recently solved": the `EmptyState` at `app/(app)/dashboard/page.tsx:69`
- Filter panel: `0 of 0`, every chip count zero
- **"Start practice" is rendered disabled** (`practice-filters.tsx:226`), since
  `matchCount` is 0
- Upload dropzone: the only live control on the screen — and it currently does
  nothing but list filenames (`upload-panel.tsx:18`)

The first 30 seconds of a new account is a screen where the primary action is
visibly disabled and the only working control is a stub. Every panel is an
empty state at once.

**Why it matters.** This is the classic cold-start / empty-state trap. The
**endowed progress effect** (Nunes & Drèze, 2006) showed that people given a
loyalty card with two of ten stamps pre-filled completed it at nearly double the
rate of those given a blank eight-stamp card — identical work remaining, but a
non-zero starting state creates commitment. Margin currently endows nothing.
Worse, a disabled primary button is a **negative competence signal** at the exact
moment of highest uncertainty.

**Concrete change.** Seed every new account with a starter set of ~10–15 problems
spanning three topics and the full difficulty range, drawn from the existing
fixtures, labelled honestly in the UI as sample problems with a one-tap "remove
these" control. "Start practice" is live before the user has uploaded anything.
This also makes the empty states in step 7 of `PLAN.md` reachable but rare —
which is the correct ratio.

### 1.2 The product's most distinctive idea is never explained to the user

**What's happening.** The spoiler rule is Margin's genuine differentiator: the
method is withheld until you commit. It is enforced rigorously in code
(`lib/problem.ts:12`, `app/(app)/solve/actions.ts`, and the citation-only tab
title at `solve/[problemId]/page.tsx:20`). It is documented thoroughly — in
`README.md`, which users never read. **Nowhere in the UI is it ever mentioned.**

**Why it matters.** An invisible feature cannot be valued, and worse, it can be
misread as an omission — a user who notices the section heading is missing may
conclude the app has incomplete metadata rather than a deliberate pedagogy.
This is the **feature-discovery** problem: unarticulated design intent reads as
absence. The withholding is also the app's single best **variable reward**
generator (see 2.3), and it is being spent silently.

**Concrete change.** One line of copy on the solve screen before first submit,
next to the citation: "Topic and method stay hidden until you answer." Show it
for the first three problems of a new account, then retire it. Consider a single
dismissible first-run card on the dashboard that states the premise in two
sentences — not a multi-step tour.

### 1.3 Time-to-aha is long and gated behind a broken step

**What's happening.** The genuine "aha" is the post-submit reveal
(`components/solve/feedback.tsx`): your outcome, the real answer, and *then* the
classification you were denied. The secondary aha is the mastery grid
(`components/profile/mastery-grid.tsx`), which is a legitimately excellent
artifact. Reaching the first requires: upload → parse → filter → start → solve →
submit. Step two does not exist yet.

**Why it matters.** Every step before first value is a drop-off surface.

**Concrete change.** With 1.1 in place, the path collapses to: land → "Start
practice" → submit → reveal. Three clicks to the aha moment. Make the dashboard's
primary button unmissable for an account with zero attempts.

---

## 2. Hook & habit formation

Working through Eyal's trigger → action → variable reward → investment.

### 2.1 Trigger: there are no external triggers, and the internal one is weak

**What's happening.** No email, no push, no scheduled anything. The only
persistent in-app trigger is the streak counter in `components/shell/top-bar.tsx:24`
— and it is `hidden ... lg:flex`, so it does not exist on mobile or tablet. The
`ProfileSnapshot` on the dashboard (`profile-snapshot.tsx:22`) does show a streak
figure at all widths, so the signal is not entirely absent on mobile, but the
*persistent, every-screen* version is desktop-only.

**Why it matters.** Eyal's model is explicit that external triggers seed the
loop until an internal trigger (here: "I have a problem set due") takes over.
Margin has no external trigger at all, so it is entirely dependent on an internal
trigger it does not shape. The internal trigger for studying is usually
*deadline anxiety* — which the app knows nothing about.

**Concrete change.** Let the user set a course exam date during onboarding, and
surface a single honest line on the dashboard: "Midterm in 12 days · 34 problems
in your weakest topics." This is an ethical trigger because it is *the user's own
stated goal*, not a manufactured obligation. Pair with an opt-in daily reminder
at a self-chosen time. Nothing else.

### 2.2 Action: the core action is excellent; the path to it is not

**What's happening.** Once solving, the action is genuinely low-friction and
well-designed: `Enter` submits and advances, `N` skips forward, `F` flags,
`?` opens the shortcut sheet (`solve-surface.tsx:87–125`). Keyboard-first, which
respects the target user.

But the dashboard positions itself as a *configuration task* before you may act.
The filter panel presents five dimensions at once — textbook, topic, five
difficulty chips, five kind chips, four status chips
(`practice-filters.tsx:169–186`). The zero-decision path does exist (press
"Start practice" with nothing selected, and `parseQueueSpec` falls back to
`PRACTICE_STATUSES`, `lib/queue.ts:86`) — but nothing communicates that. The
panel header asks "What do you want to solve?", which frames answering as
mandatory.

**Why it matters.** **Hick's Law**: decision time rises with the number and
complexity of choices. Iyengar & Lepper (2000) demonstrated that more options
can reduce action entirely. Every session begins with a configuration decision
the user did not ask to make, and configuration is a fundamentally different
cognitive mode from studying.

**Concrete change.** Add a primary, always-enabled "Start where I left off"
action above the filter panel that requires zero configuration, and demote the
filters to a collapsible "or choose what to work on." The filters are excellent
and should remain — they are the app's autonomy engine (see 4.1) — but they
should be the *considered* path, not the *default* path.

### 2.3 Variable reward: the best source is already built, and under-dramatized

**What's happening.** Rewards are informational and almost entirely
deterministic. `OutcomeBadge` (`components/ui/stat.tsx:87`) renders the same
four states identically every time. In Eyal's taxonomy Margin offers only
*rewards of the self* — mastery, completion, competence — with no tribe and no
hunt. For a solo study tool that is a defensible choice.

But there **is** a genuine variable reward already in the product, and it is
being under-used: the classification reveal. Because the method is withheld, the
moment after submit carries real informational uncertainty — *what was this
problem actually testing?* That is a variable reward in the strict sense. It is
currently rendered as a flat row of `Tag` components
(`components/solve/feedback.tsx:103–114`) with the same visual weight as the rest
of the panel.

**Why it matters.** Variable rewards drive habit formation far more strongly
than predictable ones (Zeiler's work on intermittent reinforcement in pigeons;
Berridge's dopamine-as-anticipation research). Margin has *one* honest source of
informational variability and it is presented as a metadata footer.

**Concrete change.** Restructure the feedback panel so the reveal is staged, not
simultaneous: outcome first, then the answer, then the classification appearing
last with a short stagger (~120ms). Motion is already available and
reduced-motion is already respected (`feedback.tsx:41`). Give the classification
its own labelled moment — "This was testing:" — rather than the current neutral
"Classification" header. Zero new dependencies.

### 2.4 Investment: every investment mechanism currently evaporates

**What's happening.** This is the most severe behavioral finding in the app. The
user makes four kinds of investment, and **all four are discarded**:

| Investment | Where it lives | What happens to it |
| --- | --- | --- |
| Effort on a problem | `submitAnswer` grades and returns | No `Attempt` is ever written |
| Flagging a problem | `useState` at `solve-surface.tsx:52` | Lost on navigation |
| Self-diagnosis of a miss | `errorKind` state, `solve-surface.tsx:51` | Never sent to the server |
| Working notes | `localStorage`, `notes-pad.tsx:8` | Not tied to any account |

**Why it matters.** Investment is the stage that makes the *next* loop more
likely, via stored value and the **IKEA effect** (Norton, Mochon & Ariely, 2012)
— we overvalue what we have put labour into. Margin asks for real cognitive
labour on every single problem and then throws away the artifact. There is
currently no accumulating reason to come back, because nothing accumulates. A
user could work forty problems and their account would be byte-identical to
before.

Note the compounding cruelty of the error-kind chips specifically: the app asks
the student to reflect on *why* they got something wrong — genuine metacognitive
work, the highest-value thing in the product — and discards the answer.

**Concrete change.** This is `PLAN.md` step 3 and step 4, and this analysis
raises their priority rather than adding to them. The behavioral addition:
once attempts persist, surface the accumulation *visibly and immediately* —
the ribbon gaining a tick should be perceptible on return to the dashboard, not
merely correct.

---

## 3. Feedback & reinforcement

### 3.1 A correct answer looks exactly like a wrong one

**What's happening.** The feedback panel animates in identically regardless of
outcome (`feedback.tsx:45–50`): same spring, same layout, same container. The
only difference is the badge's colour and glyph. There is no differentiated
moment for success.

**Why it matters.** The **peak-end rule** (Kahneman & Redelmeier) holds that
retrospective evaluation of an experience is dominated by its most intense moment
and its ending. Margin's natural peak is solving something hard and correctly —
and the product currently gives that moment the same emotional weight as failure.
The app will be remembered as flat, because it is flat at precisely the moment it
should not be.

**Concrete change.** Differentiate the correct-answer reveal without betraying
the calm register. The accent-colour border on the feedback surface, a slightly
faster and firmer spring, and — for a difficulty 4–5 problem answered correctly —
one short line of specific, earned copy ("Difficulty 5, first try."). Specific
acknowledgement of a real achievement is not gamification; generic confetti
would be.

### 3.2 The end of a session is nothing at all

**What's happening.** When the queue is exhausted, `nextHref` becomes
`dashboardHref(params)` and the button reads "Finish"
(`solve-surface.tsx:286`). Pressing it returns the user to the dashboard. There
is **no session summary**. No count, no accuracy, no time, no "here's what you
learned." The session simply stops existing.

**Why it matters.** Peak-end rule again, on the *end* term — the most heavily
weighted moment of the entire experience is currently a navigation event. This is
also a wasted **Zeigarnik** opportunity: a well-formed ending that names one
piece of unfinished business is what generates the intention to return.

**Concrete change.** A session recap screen at `/solve` completion — attempted,
correct, median time, the ribbon for *this session only*, and exactly one
concrete next action derived from the data ("4 of your 5 misses were setup
errors in Integration →" linking to the pre-filtered dashboard). This is the
single highest-leverage engagement addition available, and every number it needs
already exists once attempts persist.

### 3.3 Four computed dashboard fields are silently discarded

**What's happening.** `getDashboard()` in `lib/mock/api.ts:207` computes and
returns `summary` (30-day accuracy with delta), `weakSpots`, `sessions`, and
`queuedCount`. Verified by search: **none of the four is rendered anywhere.**
The dashboard consumes only `profile`, `lifetime`, `streakDays`,
`recentAttempts`, and `recentSolved`.

**Why it matters.** `queuedCount` in particular is the answer to "how much is
waiting for me?" — a **goal-gradient** signal (Hull, 1932; Kivetz et al., 2006
showed effort accelerates measurably as a goal nears). The data is computed on
every dashboard load and thrown away.

**Concrete change.** Surface `queuedCount` in the filter panel header as the
resting state, and use `summary.accuracyDelta` for a single honest trend line on
the snapshot. If the other fields stay unused after that, delete them from
`DashboardData` so the type stops advertising capability the UI does not have.

### 3.4 Smaller reinforcement gaps

- **Notes autosave** (`notes-pad.tsx:69`) renders an empty `<span>` until saved,
  then the bare word "Saved" with no transition. It pops. A brief fade, and a
  persistent-but-muted "Saved" rather than appearing/disappearing text, would
  make the investment feel banked rather than blinked.
- **The timer counts up with no reference point** (`timer.tsx`). `estimatedMinutes`
  exists on every problem and is displayed in the header
  (`solve-surface.tsx:187`) but the timer never relates to it. A count-up with no
  target is pure evaluation apprehension: it can only make you feel slow. Either
  relate it to the estimate or let the user hide it (see 5.2).
- **Streak milestones pass unmarked.** The counter increments from 6 to 7 with
  no acknowledgement. One quiet, non-blocking marker at 7/30/100 days would cost
  little and respects the register.

---

## 4. Motivation mechanics (Self-Determination Theory — Deci & Ryan)

### 4.1 Autonomy: genuinely excellent. Protect this.

**What's happening.** This is the app's strongest psychological dimension and it
should be defended in review. The filters are real, composable control
(`practice-filters.tsx`); the spec lives in the URL so sessions are shareable and
restorable (`lib/queue.ts`); "Clear" is always available; Skip is always
available (`solve-surface.tsx:282`); proofs are **self**-graded
(`feedback.tsx:70–79`); the theme is the user's choice; even the pane divider is
draggable and remembered.

**Why it matters.** Autonomy is one of SDT's three basic needs and the one most
often destroyed by "engagement" work. Most study apps railroad users down an
algorithmic queue. Margin does not, and that is a real competitive position.

**Concrete change.** None — this is a preservation note. Any future spaced-
repetition scheduling (7.1) must be *offered* rather than *imposed*, or it will
damage the app's best trait.

### 4.2 Competence: the data is superb, the timing is wrong

**What's happening.** The mastery grid is the best competence artifact in the
app: it encodes accuracy as hue and *sample size as opacity*
(`mastery-grid.tsx:12`), so two lucky answers cannot masquerade as mastery. That
is an unusually honest visualization. `WeakSpots` links straight into a filtered
session (`weak-spots.tsx:23`). The difficulty meter reads without a legend
(`stat.tsx:60`).

The problem is **placement and timing**: all of it lives on Profile, a page the
user must deliberately navigate to, and none of it updates in response to work
just completed. Competence feedback arrives only when sought.

**Why it matters.** Competence support works through **proximity to the effort**.
Feedback that requires a separate navigation act to discover is feedback most
users never receive.

**Concrete change.** Put one competence signal at the moment of action: after
submitting a problem, show that topic's mastery movement inline in the feedback
panel — "Integration, difficulty 4: 3 of your last 5." One line, using data that
already exists. The session recap (3.2) is the other natural home.

### 4.3 Relatedness: entirely absent

**What's happening.** Zero social surface. No sharing, no cohort, no comparison,
no presence. The app is strictly solo.

**Why it matters.** Relatedness is the third SDT need, and its total absence is a
real gap — studying alone is demotivating, and the loneliness of it is a genuine
cause of abandonment. But most implementations (leaderboards, streak-shaming,
public profiles) would directly contradict "the diagnostic, not the trophy case"
and would introduce social comparison into a context where the user is already
anxious.

**Concrete change.** The one form of relatedness that fits: **anonymous,
aggregate, non-competitive context.** "Median time on this problem: 4m 10s"
after submit. It answers "am I normal?" — the actual relatedness question a
struggling student has — without ranking anyone. Requires real user data, so
this is a backend-phase item. Explicitly *not* recommended: leaderboards, friend
lists, streak sharing, public profiles.

### 4.4 Where light gamification genuinely fits

Fits the product: chapter/textbook completion percentage (the data exists on
`Textbook.solvedCount`); personal-best markers per topic; the attempt ribbon
itself, which is already a beautiful non-gamified progress artifact; honest
streaks.

Does not fit, and should be rejected if proposed: XP, levels, badges,
leaderboards, avatars, currency, loot mechanics, streak-freeze monetization.
These would each contradict a stated product decision.

---

## 5. Cognitive load & flow state

### 5.1 Configuration before action

Covered in 2.2 — the dashboard's five-dimension filter panel is a decision task
standing between the user and the work. Hick's Law. The fix is a zero-decision
default path, not the removal of the filters.

### 5.2 The timer is a flow risk

**What's happening.** An always-visible clock ticks upward for the entire
duration of every problem (`timer.tsx`, mounted at `solve-surface.tsx:280`). It
is small and muted (`text-ink-3`), which shows good instincts.

**Why it matters.** Visible time pressure raises **evaluation apprehension** and
is well documented to impair performance on complex reasoning tasks specifically
— exactly the difficulty-4-and-5 problems where the app most wants the user to
persist. Flow (Csíkszentmihályi) requires the *loss* of self-conscious time
awareness; a ticking clock structurally prevents it. The data is valuable to the
product; the display may be harmful to the user.

**Concrete change.** Keep recording, make displaying optional. A click on the
timer collapses it to a dot, persisted in `localStorage` beside the existing
`margin-solve-split` key. Default it to visible; let the user who finds it
stressful turn it off. The analytics are unaffected either way.

### 5.3 The error-kind prompt interrupts at the worst possible moment

**What's happening.** After a miss, the feedback panel asks the user to classify
their own error (`feedback.tsx:83–101`). It is currently optional. `PLAN.md`
step 4 proposes **requiring** it before advancing.

**Why it matters.** This is the most valuable data the app collects and the
reason the Profile is diagnostic rather than decorative. But it is demanded at
the precise moment of lowest motivation — immediately after failure, when the
user's impulse is to move on and recover. Making it mandatory converts the
recovery moment into a compliance gate. Expect measurable session abandonment on
exactly the problems the student most needed to work through.

**Concrete change.** Do **not** hard-require it inline. Instead: (a) keep it
one-tap and inline as now, (b) let `Enter` advance without it so flow is never
blocked, and (c) collect anything unclassified in a batch at the session recap
(3.2), where the user is finished and reflective — "You missed 4. What went
wrong?" with all four shown at once. Higher completion, better data, no flow
cost. This is a deliberate amendment to `PLAN.md` step 4.

### 5.4 Mobile notes hide the problem

**What's happening.** On mobile the surface is Problem/Notes tabs
(`solve-surface.tsx:253`). Selecting "Notes" renders *only* the notes pad
(`:269`) — the problem statement disappears.

**Why it matters.** Working notes are transcription and manipulation of the
problem. Hiding the source imposes a working-memory load precisely when the user
is trying to offload working memory. Self-evidently the wrong trade on the
device with the least screen space.

**Concrete change.** In the notes tab, keep a condensed, collapsible version of
the problem statement pinned above the pad. Even three lines with a "show all"
affordance removes the recall burden.

---

## 6. Visual & emotional design

### 6.1 The system is coherent and genuinely well-made

Tokens, not hardcoded colour (`app/globals.css`). A documented shape lock —
surfaces 12, controls 8, micro 4, chips the only pill — held consistently across
every component read. Tabular numerals everywhere numbers update
(`tnum`, `globals.css:156`), so stats do not jitter. Graph-paper texture confined
to empty states and the dropzone, never a scrolling list. Reduced motion honoured
globally (`globals.css:169`) *and* per-component (`feedback.tsx:41`). A
documented z-index scale. Theme applied pre-paint so light mode never flashes
(`app/layout.tsx:33`).

The emotional register — calm, precise, serious, a quiet instrument — is correct
for the domain. Studying is effortful and often anxious; a bouncy interface would
grate within a week.

### 6.2 But it is uniformly calm, including at its peaks

**What's happening.** There is no emotional high point anywhere in the app.
Success, failure, session end, and idle browsing all occupy the same narrow
affective band.

**Why it matters.** Calm is a register, not an absence of dynamics. A product can
be restrained and still mark its important moments — restraint is what *makes*
a single moment of warmth legible. Without any variation, "calm" reads as "flat,"
and flat is forgettable.

**Concrete change.** Pick exactly two moments to break register, and keep
everything else exactly as it is: a correct answer on a difficulty 4–5 problem
(3.1), and the session recap (3.2). Two peaks in the whole product is a defensible
budget.

### 6.3 One deliberate colour trade worth re-examining

**What's happening.** Correct is rendered in accent blue; a miss is `--ember`,
an orange rather than red (`globals.css:26`).

**Why it matters.** Softening failure from red to orange is a good call —
it lowers threat response on a screen where users fail routinely. But blue for
success forgoes the culturally-loaded reward colour, and the app has no other
success signal to compensate. Combined with 3.1 and 6.2, correctness ends up
under-marked from several directions at once.

**Concrete change.** Keep the palette. Compensate through motion and copy rather
than hue, per 3.1. Flagged here because the reasoning should be explicit rather
than accidental.

### 6.4 Copy is the best-executed part of the product

Genuinely strong, specific, human writing throughout:

- "Two study days are needed before a trend means anything."
  (`trend-chart.tsx:17`) — refuses to draw a meaningless chart and says why.
- "Faded cells rest on few attempts." (`mastery-grid.tsx:58`) — teaches the
  encoding in five words.
- "Your problems and attempts are safe. This is a display problem on our side."
  (`dashboard/error.tsx:18`) — exemplary error copy. It answers the user's actual
  fear (data loss) before explaining anything, and it takes the blame.
- Placeholder discipline: `"3/4 or \\frac{3}{4}"` (`answer-input.tsx:140`) is
  deliberately generic so it can never leak the answer.

Three weak points:

1. **"What went wrong? This is what makes your analytics diagnostic."**
   (`feedback.tsx:86`) — product vocabulary intruding at an emotionally loaded
   moment. The user just failed; "your analytics" is the app talking about
   itself. Replace with something about the student: *"What went wrong? Knowing
   whether you slipped or never had the method is the difference between
   practice and repetition."*
2. **"Queued locally. Classification runs once the backend is connected."**
   (`upload-panel.tsx:110`) — "the backend" is engineering vocabulary in a user
   surface. It is admirably honest, and the honesty should survive the rewrite:
   *"Saved on this device. We'll read and sort these once uploads are live."*
3. **"We read each problem and tag it by topic, type, and difficulty."**
   (`upload-panel.tsx:111`) — present tense for a capability that does not exist.
   Move to future tense until it does.

---

## 7. Retention levers

### 7.1 Spaced repetition is the one mechanic that is both effective and honest

**What's happening.** `readyToReview` already computes problems missed more than
once, sorted by miss count (`lib/mock/api.ts:385`), rendered by
`components/profile/review-list.tsx`. It is a static list on a page users rarely
visit, and nothing surfaces it at the right time.

**Why it matters.** The **spacing effect** is among the most robust findings in
learning science (Ebbinghaus, 1885; Cepeda et al., 2006 meta-analysis) — the same
study time distributed over intervals produces substantially better retention
than massed practice. This is the rare mechanic where what is good for retention
*of the user* and what is good for retention *of the material* are the same
thing. It is engagement design with no ethical tension.

**Concrete change.** Compute a due-date per missed problem on a simple expanding
interval (1, 3, 7, 21 days). Surface the count on the dashboard as a first-class
resting state — "6 problems due for review" — and as a one-tap queue. Do not
auto-enqueue: offer it (see 4.1).

### 7.2 Nothing currently brings a user back tomorrow

**What's happening.** No email, no push, no reminder, no scheduled surface. The
streak is the only returning-user artifact and it is display-only and partly
desktop-only (2.1).

**Concrete change.** In priority order: (a) the session recap's single next
action (3.2), which plants a specific intention before the user leaves; (b)
review-due counts (7.1); (c) a self-scheduled, opt-in daily reminder at a
user-chosen time; (d) exam-date awareness (2.1).

### 7.3 Explicitly rejected levers

Recording these so they are not re-proposed later: streak-loss guilt messaging;
notification pressure the user did not opt into; leaderboards or peer comparison;
artificial scarcity; any dark pattern around the streak. Margin's users are
anxious students, which makes manipulative retention both easier and more
harmful than usual. The product's stated philosophy already rules these out;
this section makes it explicit.

---

## Cross-cutting conclusion

Margin is an unusually well-designed product at the level of craft — the design
system, the copy, the spoiler rule, and the honesty of the mastery visualization
are all genuinely above the norm. Its psychological weaknesses are not craft
failures but **structural** ones, and they concentrate in two places:

1. **Nothing accumulates.** The investment stage of the habit loop is absent
   because persistence is absent. Until `PLAN.md` step 3 lands, no engagement
   work can compound — every improvement below it is a local one.
2. **Nothing is marked.** The app has no peak and no ending. It is uniformly
   calm across success, failure, and completion, which makes a well-crafted
   experience emotionally forgettable.

The good news is that both are addressable without compromising the product's
character, and the highest-leverage item — a session recap — needs no new data
model, only the attempt persistence already planned.
