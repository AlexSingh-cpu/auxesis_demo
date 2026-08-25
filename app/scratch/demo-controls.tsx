"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/chip";
import { Field, Input, TextArea } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";

const TOPICS = [
  { id: "integration", label: "Integration", count: 84 },
  { id: "series", label: "Series", count: 51 },
  { id: "eigen", label: "Eigenvalues", count: 23 },
  { id: "distributions", label: "Distributions", count: 37 },
];

export function DemoControls() {
  const [range, setRange] = useState<"7d" | "30d" | "all">("30d");
  const [selected, setSelected] = useState<string[]>(["series"]);
  const [answer, setAnswer] = useState("");

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-[13px] text-ink-2">Segmented, for the range selector</p>
        <Segmented
          label="Analytics range"
          value={range}
          onChange={setRange}
          options={[
            { value: "7d", label: "7 days" },
            { value: "30d", label: "30 days" },
            { value: "all", label: "All time" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[13px] text-ink-2">
          Filter chips, selected {selected.length} of {TOPICS.length}
        </p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((topic) => (
            <Chip
              key={topic.id}
              selected={selected.includes(topic.id)}
              count={topic.count}
              onClick={() => toggle(topic.id)}
            >
              {topic.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Your answer"
          htmlFor="demo-answer"
          hint="Fractions and expressions are both accepted."
        >
          <Input
            id="demo-answer"
            mono
            placeholder="2/15"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </Field>

        <Field
          label="Chapter"
          htmlFor="demo-chapter"
          error="Enter a chapter number, for example 7.2"
        >
          <Input id="demo-chapter" invalid defaultValue="seven" />
        </Field>

        <Field
          label="Working notes"
          htmlFor="demo-notes"
          hint="Autosaves as you type."
          className="md:col-span-2"
        >
          <TextArea
            id="demo-notes"
            mono
            rows={4}
            placeholder="u = cos x, du = -sin x dx"
          />
        </Field>
      </div>
    </div>
  );
}
