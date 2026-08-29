import { describe, expect, it } from "vitest";
import { selectSessionAttempts } from "@/lib/session";
import type { Attempt } from "@/lib/types";

function attempt(id: string, at: string): Attempt {
  return {
    id,
    problemId: "p_0001",
    outcome: "correct",
    submittedAnswer: "1",
    seconds: 30,
    at,
    topicId: "limits",
    difficulty: 3,
  };
}

describe("selectSessionAttempts", () => {
  it("returns an empty array when there are no attempts", () => {
    expect(selectSessionAttempts([])).toEqual([]);
  });

  it("keeps every attempt when consecutive gaps are all under 30 minutes", () => {
    const list = [
      attempt("a1", "2026-08-28T10:00:00.000Z"),
      attempt("a2", "2026-08-28T10:10:00.000Z"),
      attempt("a3", "2026-08-28T10:25:00.000Z"),
    ];

    expect(selectSessionAttempts(list).map((a) => a.id)).toEqual([
      "a1",
      "a2",
      "a3",
    ]);
  });

  it("cuts off everything before a gap longer than 30 minutes", () => {
    const list = [
      attempt("a1", "2026-08-28T09:00:00.000Z"),
      attempt("a2", "2026-08-28T09:05:00.000Z"),
      // 45-minute gap here
      attempt("a3", "2026-08-28T09:50:00.000Z"),
      attempt("a4", "2026-08-28T09:55:00.000Z"),
    ];

    expect(selectSessionAttempts(list).map((a) => a.id)).toEqual([
      "a3",
      "a4",
    ]);
  });

  it("is order-independent: sorts by timestamp before finding the boundary", () => {
    const list = [
      attempt("a4", "2026-08-28T09:55:00.000Z"),
      attempt("a1", "2026-08-28T09:00:00.000Z"),
      attempt("a3", "2026-08-28T09:50:00.000Z"),
      attempt("a2", "2026-08-28T09:05:00.000Z"),
    ];

    expect(selectSessionAttempts(list).map((a) => a.id)).toEqual([
      "a3",
      "a4",
    ]);
  });

  it("treats a gap of exactly 30 minutes as still the same session", () => {
    const list = [
      attempt("a1", "2026-08-28T09:00:00.000Z"),
      attempt("a2", "2026-08-28T09:30:00.000Z"),
    ];

    expect(selectSessionAttempts(list).map((a) => a.id)).toEqual([
      "a1",
      "a2",
    ]);
  });

  it("respects a custom gap threshold", () => {
    const list = [
      attempt("a1", "2026-08-28T09:00:00.000Z"),
      attempt("a2", "2026-08-28T09:10:00.000Z"),
    ];

    expect(
      selectSessionAttempts(list, 5 * 60 * 1000).map((a) => a.id)
    ).toEqual(["a2"]);
  });

  it("returns a single attempt as its own session", () => {
    const list = [attempt("a1", "2026-08-28T09:00:00.000Z")];
    expect(selectSessionAttempts(list).map((a) => a.id)).toEqual(["a1"]);
  });
});
