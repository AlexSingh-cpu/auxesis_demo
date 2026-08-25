"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FlagIcon } from "@phosphor-icons/react";
import {
  submitAnswer,
  type SubmissionResult,
} from "@/app/(app)/solve/actions";
import { MathHtml } from "@/components/problem/math-html";
import { Button, IconButton } from "@/components/ui/button";
import { Shortcut } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { DifficultyMeter } from "@/components/ui/stat";
import type { AttemptOutcome, ErrorKind, SolveProblem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AnswerInput } from "./answer-input";
import { Feedback } from "./feedback";
import { NotesPad } from "./notes-pad";
import { Timer } from "./timer";

const SPLIT_KEY = "margin-solve-split";
const DEFAULT_SPLIT = "58%";

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

  const splitRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const submitted = result !== null;

  const submit = useCallback(() => {
    if (submitted || pending || answer.trim() === "") return;
    startTransition(async () => {
      const submission = await submitAnswer(problem.id, answer);
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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        if (submitted) goNext();
        else submit();
        return;
      }

      if (event.key === "Escape") {
        setShortcutsOpen(false);
        return;
      }

      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "Enter") {
        event.preventDefault();
        if (submitted) goNext();
        else submit();
      } else if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen((open) => !open);
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
  }, [goNext, submit, submitted]);

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
      <p className="font-mono text-[13px] text-ink-3">{citation}</p>
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

      {/* Desktop: resizable two-pane. */}
      <div
        ref={splitRef}
        className="hidden lg:grid lg:items-start"
        style={{
          gridTemplateColumns: `var(--split, ${DEFAULT_SPLIT}) 13px 1fr`,
        }}
      >
        <section className="pr-2">{problemPane}</section>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panes"
          tabIndex={0}
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
          className="group flex h-full cursor-col-resize touch-none justify-center py-1"
        >
          <span className="w-px bg-line transition-colors duration-150 group-hover:bg-accent" />
        </div>

        <section className="flex flex-col gap-6 pl-4">
          {answerPane}
          <NotesPad problemId={problem.id} />
        </section>
      </div>

      {/* Mobile: one pane at a time. */}
      <div className="flex flex-col gap-5 lg:hidden">
        <Segmented
          label="Solving view"
          value={tab}
          onChange={setTab}
          options={[
            { value: "problem", label: "Problem" },
            { value: "notes", label: "Notes" },
          ]}
          className="self-start"
        />
        {tab === "problem" ? (
          <div className="flex flex-col gap-6">
            {problemPane}
            {answerPane}
          </div>
        ) : (
          <NotesPad problemId={problem.id} className="min-h-[50vh]" />
        )}
      </div>

      {/* Action bar. Sits above the mobile tab bar, inline on desktop. */}
      <div
        className={cn(
          "sticky bottom-16 z-10 -mx-4 mt-2 flex items-center gap-3 border-t border-line",
          "bg-bg/95 px-4 py-3 backdrop-blur-md md:bottom-0 md:mx-0 md:rounded-control md:border md:px-4"
        )}
      >
        <Timer running={!submitted} />
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

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: "var(--overlay)" }}
      onClick={onClose}
    >
      <div
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
        <Button
          variant="secondary"
          size="sm"
          className="mt-5 w-full"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}
