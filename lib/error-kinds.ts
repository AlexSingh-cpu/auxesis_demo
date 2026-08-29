import type { ErrorKind } from "@/lib/types";

/** Shared between the inline feedback chip and the recap's classification
 *  prompt, so the two moments where a miss gets classified never disagree
 *  about the label or hint text. */
export const ERROR_KINDS: { kind: ErrorKind; label: string; hint: string }[] = [
  { kind: "conceptual", label: "Concept", hint: "Did not know the method" },
  { kind: "arithmetic", label: "Arithmetic", hint: "Right method, slipped" },
  { kind: "setup", label: "Setup", hint: "Wrong starting equation" },
  { kind: "incomplete", label: "Incomplete", hint: "Ran out of steps" },
];
