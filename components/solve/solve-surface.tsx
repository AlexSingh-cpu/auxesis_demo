"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { FlagIcon } from "@phosphor-icons/react";
import {
  confirmGrade,
  submitAnswer,
  type SubmissionResult,
} from "@/app/(app)/solve/actions";
import { MathHtml } from "@/components/problem/math-html";
import { Button, buttonStyles, IconButton } from "@/components/ui/button";
import { Shortcut } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { DifficultyMeter } from "@/components/ui/stat";
import type { AttemptOutcome, ErrorKind, SolveProblem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AnswerInput } from "./answer-input";
import { Feedback } from "./feedback";
import { NotesPad } from "./notes-pad";
import { Timer, type TimerHandle } from "./timer";

const SPLIT_KEY = "margin-solve-split";
const DEFAULT_SPLIT = "58%";
const SPOILER_HINT_KEY = "margin-spoiler-hint-seen";
const SPOILER_HINT_LIMIT = 3;

/** No external event fires when the count changes, so nothing needs to
 *  subscribe: this mount's value only needs to be read once, up front. */
function noopSubscribe() {
  return () => {};
}

function getSpoilerHintSnapshot(): boolean {
  try {
    return Number(window.localStorage.getItem(SPOILER_HINT_KEY) ?? "0") < SPOILER_HINT_LIMIT;
  } catch {
    return true;
  }
}

function getSpoilerHintServerSnapshot(): boolean {
  return false;
}

interface SolveSurfaceProps {
  problem: SolveProblem;
  bodyHtml: string;
  citation: string;
  /** Where advancing goes: the next problem, or back to the queue at the end. */
  nextHref: string;
  hasNext: boolean;
  index: number;
  total: number;
}

export function SolveSurface({
  problem,
  bodyHtml,
  citation,
  nextHref,
  hasNext,
  index,
  total,
}: SolveSurfaceProps) {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [outcome, setOutcome] = useState<AttemptOutcome | null>(null);
  const [selfGraded, setSelfGraded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [flagged, setFlagged] = useState(problem.status === "flagged");
  const [tab, setTab] = useState<"problem" | "notes">("problem");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const showSpoilerHint = useSyncExternalStore(
    noopSubscribe,
    getSpoilerHintSnapshot,
    getSpoilerHintServerSnapshot
  );

  const splitRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const timerRef = useRef<TimerHandle>(null);

  const submitted = result !== null;

  const submit = useCallback(() => {
    if (submitted || pending || answer.trim() === "") return;
    const seconds = timerRef.current?.getSeconds() ?? 0;
    startTransition(async () => {
      const submission = await submitAnswer(problem.id, answer, seconds);
      setResult(submission);
      setOutcome(submission.outcome);
      setSelfGraded(submission.selfGraded);
    });
  }, [answer, pending, problem.id, submitted]);

  const goNext = useCallback(() => {
    router.push(nextHref);
  }, [nextHref, router]);

  // Restore the divider position without a render pass.
  useEffect(() => {
    const node = splitRef.current;
    if (!node) return;
    try {
      const stored = window.localStorage.getItem(SPLIT_KEY);
      if (stored) node.style.setProperty("--split", stored);
    } catch {
      // Fall back to the default split.
    }
  }, []);

  // The spoiler rule is the product's core premise and is otherwise never
  // stated in the UI. Explain it for the first few problems, then stop. This
  // mount's copy of showSpoilerHint already reflects the count read above;
  // this only advances the count for the mount after this one.
  useEffect(() => {
    try {
      const seen = Number(window.localStorage.getItem(SPOILER_HINT_KEY) ?? "0");
      if (seen < SPOILER_HINT_LIMIT) {
        window.localStorage.setItem(SPOILER_HINT_KEY, String(seen + 1));
      }
    } catch {
      // Local storage unavailable; the hint simply keeps showing.
    }
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShortcutsOpen(false);
        return;
      }

      // Only the key that toggles the sheet still works while it is open, so
      // a background "N" or "F" cannot fire underneath a modal dialog.
      if (shortcutsOpen) {
        if (event.key === "?") {
          event.preventDefault();
          setShortcutsOpen(false);
        }
        return;
      }

      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        if (submitted) goNext();
        else submit();
        return;
      }

      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "Enter") {
        event.preventDefault();
        if (submitted) goNext();
        else submit();
      } else if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(true);
      } else if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        goNext();
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        setFlagged((value) => !value);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, submit, submitted, shortcutsOpen]);

  function setSplit(percent: number) {
    const clamped = Math.min(70, Math.max(35, percent));
    splitRef.current?.style.setProperty("--split", `${clamped.toFixed(2)}%`);
  }

  function persistSplit() {
    try {
      window.localStorage.setItem(
        SPLIT_KEY,
        splitRef.current?.style.getPropertyValue("--split") || DEFAULT_SPLIT
      );
    } catch {
      // Position simply is not remembered.
    }
  }

  const problemPane = (
    <div className="flex flex-col gap-5">
      <MathHtml
        html={bodyHtml}
        className="text-[17px] leading-[1.7] text-ink"
      />
      <div className="flex flex-col gap-1">
        <p className="font-mono text-[13px] text-ink-3">{citation}</p>
        {showSpoilerHint && !submitted ? (
          <p className="text-[12px] text-ink-3">
            Topic and method stay hidden until you answer.
          </p>
        ) : null}
      </div>
    </div>
  );

  const answerPane = (
    <div className="flex flex-col gap-5">
      <AnswerInput
        problem={problem}
        value={answer}
        onChange={setAnswer}
        disabled={submitted}
      />
      {result && outcome ? (
        <Feedback
          answerHtml={result.answerHtml}
          subtopic={result.subtopic}
          chapterTitle={result.chapterTitle}
          tags={result.tags}
          outcome={outcome}
          selfGraded={selfGraded}
          errorKind={errorKind}
          onErrorKind={setErrorKind}
          onSelfGrade={(next) => {
            setOutcome(next);
            setSelfGraded(false);
            // result is non-null here — Feedback only renders once it is.
            startTransition(async () => {
              await confirmGrade(result.attemptId, next);
            });
          }}
        />
      ) : null}
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-8 pt-6 md:pt-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <p className="font-mono tnum text-[13px] text-ink-3">
          {index} of {total}
        </p>
        <DifficultyMeter value={problem.difficulty} />
        <p className="text-[13px] text-ink-3">
          about {problem.estimatedMinutes} min
        </p>
        <div className="ml-auto flex items-center gap-1">
          <IconButton
            label={flagged ? "Remove flag" : "Flag this problem"}
            onClick={() => setFlagged((value) => !value)}
            className={flagged ? "text-flag" : undefined}
          >
            <FlagIcon size={18} weight={flagged ? "fill" : "regular"} />
          </IconButton>
        </div>
      </div>

      {/* Below `lg` this is a single column, one pane visible at a time via
          the segmented control. At `lg` and up it becomes a resizable
          two-pane grid. Same elements throughout — only their grid-area
          placement and visibility change, so nothing ever mounts twice. */}
      <Segmented
        label="Solving view"
        value={tab}
        onChange={setTab}
        options={[
          { value: "problem", label: "Problem" },
          { value: "notes", label: "Notes" },
        ]}
        className="self-start lg:hidden"
      />

      <div ref={splitRef} className="solve-grid">
        <section
          style={{ gridArea: "problem" }}
          className={cn("flex flex-col lg:pr-2", tab === "notes" ? "hidden lg:flex" : "flex")}
        >
          {problemPane}
        </section>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panes"
          tabIndex={0}
          style={{ gridArea: "resizer" }}
          onPointerDown={(event) => {
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!dragging.current || !splitRef.current) return;
            const rect = splitRef.current.getBoundingClientRect();
            setSplit(((event.clientX - rect.left) / rect.width) * 100);
          }}
          onPointerUp={(event) => {
            dragging.current = false;
            event.currentTarget.releasePointerCapture(event.pointerId);
            persistSplit();
          }}
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const current =
              splitRef.current?.style.getPropertyValue("--split") ||
              DEFAULT_SPLIT;
            const percent = parseFloat(current) || 58;
            setSplit(percent + (event.key === "ArrowLeft" ? -2 : 2));
            persistSplit();
          }}
          className="group hidden h-full cursor-col-resize touch-none justify-center py-1 lg:flex"
        >
          <span className="w-px bg-line transition-colors duration-150 group-hover:bg-accent" />
        </div>

        <section
          style={{ gridArea: "answer" }}
          className={cn("flex flex-col lg:pl-4", tab === "notes" ? "hidden lg:flex" : "flex")}
        >
          {answerPane}
        </section>

        <section
          style={{ gridArea: "notes" }}
          className={cn("flex flex-col lg:pl-4", tab === "problem" ? "hidden lg:flex" : "flex")}
        >
          <NotesPad
            problemId={problem.id}
            className={tab === "notes" ? "min-h-[50vh] lg:min-h-0" : undefined}
          />
        </section>
      </div>

      {/* Action bar. Sits above the mobile tab bar, inline on desktop. */}
      <div
        className={cn(
          "sticky bottom-16 z-10 -mx-4 mt-2 flex items-center gap-3 border-t border-line",
          "bg-bg/95 px-4 py-3 backdrop-blur-md md:bottom-0 md:mx-0 md:rounded-control md:border md:px-4"
        )}
      >
        <Timer ref={timerRef} running={!submitted} />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goNext}>
            Skip
          </Button>
          {submitted ? (
            <Button size="sm" onClick={goNext}>
              {hasNext ? "Next problem" : "Finish"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={submit}
              disabled={answer.trim() === "" || pending}
            >
              {pending ? "Checking" : "Submit"}
            </Button>
          )}
        </div>
      </div>

      <p className="hidden items-center gap-2 text-[13px] text-ink-3 lg:flex">
        <Shortcut>Enter</Shortcut> submit
        <Shortcut>N</Shortcut> next
        <Shortcut>F</Shortcut> flag
        <Shortcut>?</Shortcut> all shortcuts
      </p>

      {shortcutsOpen ? (
        <ShortcutSheet onClose={() => setShortcutsOpen(false)} />
      ) : null}
    </div>
  );
}

function ShortcutSheet({ onClose }: { onClose: () => void }) {
  const rows = [
    ["Enter", "Submit, then advance"],
    ["Cmd or Ctrl + Enter", "Submit from the notes pad"],
    ["N", "Next problem"],
    ["F", "Flag this problem"],
    ["?", "Open and close this list"],
    ["Esc", "Close"],
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  // A minimal trap: cycle Tab between the first and last focusable elements
  // so background content never receives focus while this is open.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !containerRef.current) return;

      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: "var(--overlay)" }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-surface border border-line bg-surface p-5"
        style={{ boxShadow: "var(--shadow-overlay)" }}
      >
        <h2 className="pb-4 text-[15px] font-semibold text-ink">
          Keyboard shortcuts
        </h2>
        <dl className="flex flex-col gap-3">
          {rows.map(([key, description]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <dt className="text-[13px] text-ink-2">{description}</dt>
              <dd>
                <Shortcut>{key}</Shortcut>
              </dd>
            </div>
          ))}
        </dl>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className={buttonStyles("secondary", "sm", "mt-5 w-full")}
        >
          Close
        </button>
      </div>
    </div>
  );
}
