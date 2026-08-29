"use client";

import { motion, useReducedMotion } from "motion/react";
import { MathHtml } from "@/components/problem/math-html";
import { Button } from "@/components/ui/button";
import { Chip, Tag } from "@/components/ui/chip";
import { OutcomeBadge } from "@/components/ui/stat";
import { ERROR_KINDS } from "@/lib/error-kinds";
import { cn } from "@/lib/utils";
import type { AttemptOutcome, Difficulty, ErrorKind } from "@/lib/types";

interface FeedbackProps {
  answerHtml: string;
  /** Revealed by the server only once an answer has been submitted. */
  subtopic: string;
  chapterTitle: string;
  tags: string[];
  outcome: AttemptOutcome;
  /** Marks a hard problem solved correctly distinctly from a routine one. */
  difficulty: Difficulty;
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
  difficulty,
  selfGraded,
  errorKind,
  onErrorKind,
  onSelfGrade,
}: FeedbackProps) {
  const reduce = useReducedMotion();
  const needsErrorKind = outcome === "incorrect" || outcome === "partial";
  // The classification reveal is otherwise the product's only variable
  // reward, and it renders identically whether you just cleared a routine
  // problem or a genuinely hard one — so a correct answer at difficulty 4-5
  // gets its own accent and a firmer spring, the app's second emotional peak.
  const isPeak = outcome === "correct" && difficulty >= 4;

  // Three stages — outcome, then answer, then classification — staggered
  // rather than springing in as one block, so the reveal reads as a sequence
  // instead of a flat metadata footer. Reduced motion collapses the stagger
  // and the spring to an instant, single-frame reveal.
  const container = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduce ? 0 : 0.12 },
    },
  };
  const item = {
    hidden: reduce ? {} : { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: reduce
        ? { duration: 0 }
        : isPeak
          ? { type: "spring" as const, stiffness: 340, damping: 20 }
          : { type: "spring" as const, stiffness: 220, damping: 26 },
    },
  };

  return (
    <motion.div
      // Inline, never a modal. The reveal is the payoff moment of the product.
      initial="hidden"
      animate="visible"
      variants={container}
      className={cn(
        "flex flex-col gap-5 rounded-control border p-4",
        isPeak ? "border-accent bg-accent-soft/40" : "border-line bg-surface-2"
      )}
    >
      <motion.div variants={item} className="flex flex-wrap items-center gap-3">
        <OutcomeBadge outcome={outcome} />
        {selfGraded ? (
          <span className="text-[13px] text-ink-2">
            Compare your work against the reference, then mark it.
          </span>
        ) : null}
      </motion.div>

      <motion.div variants={item} className="flex flex-col gap-5">
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
      </motion.div>

      <motion.div variants={item} className="flex flex-col gap-2.5">
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
      </motion.div>
    </motion.div>
  );
}
