"use client";

import { motion, useReducedMotion } from "motion/react";
import { MathHtml } from "@/components/problem/math-html";
import { Button } from "@/components/ui/button";
import { Chip, Tag } from "@/components/ui/chip";
import { OutcomeBadge } from "@/components/ui/stat";
import type { AttemptOutcome, ErrorKind } from "@/lib/types";

const ERROR_KINDS: { kind: ErrorKind; label: string; hint: string }[] = [
  { kind: "conceptual", label: "Concept", hint: "Did not know the method" },
  { kind: "arithmetic", label: "Arithmetic", hint: "Right method, slipped" },
  { kind: "setup", label: "Setup", hint: "Wrong starting equation" },
  { kind: "incomplete", label: "Incomplete", hint: "Ran out of steps" },
];

interface FeedbackProps {
  answerHtml: string;
  /** Revealed by the server only once an answer has been submitted. */
  subtopic: string;
  chapterTitle: string;
  tags: string[];
  outcome: AttemptOutcome;
  selfGraded: boolean;
  errorKind: ErrorKind | null;
  onErrorKind: (kind: ErrorKind) => void;
  onSelfGrade: (outcome: AttemptOutcome) => void;
}

export function Feedback({
  answerHtml,
  subtopic,
  chapterTitle,
  tags,
  outcome,
  selfGraded,
  errorKind,
  onErrorKind,
  onSelfGrade,
}: FeedbackProps) {
  const reduce = useReducedMotion();
  const needsErrorKind = outcome === "incorrect" || outcome === "partial";

  return (
    <motion.div
      // Inline, never a modal. The reveal is the payoff moment of the product.
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="flex flex-col gap-5 rounded-control border border-line bg-surface-2 p-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <OutcomeBadge outcome={outcome} />
        {selfGraded ? (
          <span className="text-[13px] text-ink-2">
            Compare your work against the reference, then mark it.
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
          {selfGraded ? "Reference" : "Answer"}
        </p>
        <MathHtml html={answerHtml} className="text-[15px] text-ink" />
      </div>

      {selfGraded ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onSelfGrade("correct")}>
            I got this
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onSelfGrade("incorrect")}
          >
            I missed it
          </Button>
        </div>
      ) : null}

      {needsErrorKind && !selfGraded ? (
        <div className="flex flex-col gap-2.5">
          <p className="text-[13px] text-ink-2">
            What went wrong? Knowing whether you slipped or never had the
            method is the difference between practice and repetition.
          </p>
          <div className="flex flex-wrap gap-2">
            {ERROR_KINDS.map((entry) => (
              <Chip
                key={entry.kind}
                selected={errorKind === entry.kind}
                title={entry.hint}
                onClick={() => onErrorKind(entry.kind)}
              >
                {entry.label}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
          Classification
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Tag>{chapterTitle}</Tag>
          <Tag>{subtopic}</Tag>
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
