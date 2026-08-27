"use client";

import { useEffect, useId, useRef } from "react";
import type { SolveProblem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input, TextArea } from "@/components/ui/field";

/** KaTeX is loaded on demand so it never sits in the initial route bundle. */
function MathPreview({ tex }: { tex: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const node = ref.current;
    if (!node) return;

    if (tex.trim() === "") {
      node.innerHTML = "";
      return;
    }

    import("katex")
      .then(({ default: katex }) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = katex.renderToString(tex, {
          throwOnError: false,
          strict: false,
        });
      })
      .catch(() => {
        if (!cancelled && ref.current) ref.current.textContent = tex;
      });

    return () => {
      cancelled = true;
    };
  }, [tex]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="min-h-8 rounded-control border border-line bg-surface px-3 py-1.5 text-ink"
    />
  );
}

interface AnswerInputProps {
  problem: SolveProblem;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export function AnswerInput({
  problem,
  value,
  onChange,
  disabled,
}: AnswerInputProps) {
  const format = problem.answerFormat;
  const inputId = useId();

  if (format.kind === "choice") {
    return (
      <fieldset disabled={disabled} className="flex flex-col gap-2">
        <legend className="pb-2 text-[13px] font-medium text-ink-2">
          Choose one
        </legend>
        {(format.choices ?? []).map((choice) => {
          const selected = value === choice.id;
          return (
            <label
              key={choice.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-control border px-3.5 py-3",
                "text-sm transition-colors duration-150",
                selected
                  ? "border-accent bg-accent-soft text-ink"
                  : "border-line bg-surface-2 text-ink-2 hover:border-line-strong hover:text-ink",
                disabled && "cursor-not-allowed opacity-70"
              )}
            >
              <input
                type="radio"
                name="answer"
                value={choice.id}
                checked={selected}
                onChange={() => onChange(choice.id)}
                className="size-4 accent-accent"
              />
              {choice.body}
            </label>
          );
        })}
      </fieldset>
    );
  }

  if (format.kind === "free-response") {
    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={inputId}
          className="text-[13px] font-medium text-ink-2"
        >
          Your reasoning
        </label>
        <TextArea
          id={inputId}
          rows={5}
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Outline the argument. You will grade this against the reference yourself."
        />
        <p className="text-[13px] text-ink-3">
          Written answers are self-assessed against the reference solution.
        </p>
      </div>
    );
  }

  const isExpression = format.kind === "expression";

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-[13px] font-medium text-ink-2">
        Your answer
      </label>
      <div className="flex items-center gap-2">
        <Input
          id={inputId}
          mono
          autoComplete="off"
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          // Deliberately generic: a placeholder that resembles the answer
          // would give the problem away.
          placeholder={isExpression ? "3/4 or \\frac{3}{4}" : "12.5"}
        />
        {format.unit ? (
          <span className="shrink-0 font-mono text-[13px] text-ink-3">
            {format.unit}
          </span>
        ) : null}
      </div>
      {isExpression ? (
        <>
          <p className="text-[13px] text-ink-3">
            LaTeX is accepted. Fractions and decimals both count.
          </p>
          <MathPreview tex={value} />
        </>
      ) : (
        <p className="text-[13px] text-ink-3">
          {format.tolerance
            ? `Accurate to within ${format.tolerance}.`
            : "Enter a number."}
        </p>
      )}
    </div>
  );
}
