import { describe, expect, it } from "vitest";
import {
  PRACTICE_STATUSES,
  hasActiveFilters,
  parseQueueSpec,
  queueQuery,
} from "@/lib/queue";

describe("parseQueueSpec", () => {
  it("splits comma-separated values for multi-select keys", () => {
    const spec = parseQueueSpec({ kind: "proof,computational", d: "3,5" });
    expect(spec.kinds).toEqual(["proof", "computational"]);
    expect(spec.difficulties).toEqual([3, 5]);
  });

  it("also accepts repeated params as an array, same as comma-separated", () => {
    const spec = parseQueueSpec({ kind: ["proof", "computational"] });
    expect(spec.kinds).toEqual(["proof", "computational"]);
  });

  it("drops out-of-range or non-integer difficulty values", () => {
    const spec = parseQueueSpec({ d: "0,3,6,2.5,abc" });
    expect(spec.difficulties).toEqual([3]);
  });

  it("drops kind and status values that are not in the known set", () => {
    const spec = parseQueueSpec({
      kind: "proof,not-a-kind",
      status: "missed,not-a-status",
    });
    expect(spec.kinds).toEqual(["proof"]);
    expect(spec.statuses).toEqual(["missed"]);
  });

  it("defaults an empty status filter to PRACTICE_STATUSES rather than nothing", () => {
    const spec = parseQueueSpec({});
    expect(spec.statuses).toEqual(PRACTICE_STATUSES);
  });

  it("keeps an explicit status filter as given, not merged with the default", () => {
    const spec = parseQueueSpec({ status: "mastered" });
    expect(spec.statuses).toEqual(["mastered"]);
  });

  it("trims whitespace and drops empty entries", () => {
    const spec = parseQueueSpec({ book: " tb_a , , tb_b " });
    expect(spec.textbookIds).toEqual(["tb_a", "tb_b"]);
  });
});

describe("queueQuery", () => {
  it("serializes only the queue keys, dropping unrelated params", () => {
    const query = queueQuery({ book: "tb_a", utm_source: "email" });
    expect(query).toBe("?book=tb_a");
  });

  it("returns an empty string when no queue keys are present", () => {
    expect(queueQuery({ utm_source: "email" })).toBe("");
    expect(queueQuery({})).toBe("");
  });

  it("re-joins multi-value keys with commas", () => {
    const query = queueQuery({ kind: ["proof", "computational"] });
    expect(query).toBe("?kind=proof%2Ccomputational");
  });
});

describe("hasActiveFilters", () => {
  it("is false when only unrelated params are present", () => {
    expect(hasActiveFilters({ utm_source: "email" })).toBe(false);
  });

  it("is true when any queue key has a value", () => {
    expect(hasActiveFilters({ topic: "integration" })).toBe(true);
  });

  it("is false for an empty or whitespace-only queue key", () => {
    expect(hasActiveFilters({ book: "" })).toBe(false);
    expect(hasActiveFilters({ book: "  " })).toBe(false);
  });
});
