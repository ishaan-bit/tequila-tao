// Home shows exactly one dominant action. This pins the state machine that
// decides which one, across the day and the user's logged state.
import { describe, it, expect } from "vitest";
import { primaryAction, greeting, partOfDay, formatLongDate } from "./home.js";

// Minimal stats shape the resolver reads. last7's second-to-last entry is
// "yesterday"; the last is "today".
const base = {
  last7: [{ status: "none" }, { status: "none" }],
  drankToday: false,
  frozenToday: false,
  clearToday: false,
  decidedToday: false,
  moodToday: null,
  softLandingToday: false,
};

describe("primaryAction", () => {
  it("morning after a drinking night → recovery (until cared for)", () => {
    const s = { ...base, last7: [{ status: "drank" }, { status: "none" }] };
    expect(primaryAction(s, 8).kind).toBe("recover");
  });

  it("once a soft-landing is logged, morning stops nagging recovery", () => {
    const s = { ...base, last7: [{ status: "drank" }, { status: "none" }], softLandingToday: true };
    expect(primaryAction(s, 8).kind).toBe("checkin"); // falls through to the gentle check-in
  });

  it("tonight already decided → a quiet confirmation of the right status", () => {
    expect(primaryAction({ ...base, decidedToday: true, clearToday: true }, 20)).toEqual({
      kind: "logged",
      status: "clear",
    });
    expect(primaryAction({ ...base, decidedToday: true, drankToday: true }, 20)).toEqual({
      kind: "logged",
      status: "drank",
    });
    expect(primaryAction({ ...base, decidedToday: true, frozenToday: true }, 20)).toEqual({
      kind: "logged",
      status: "frozen",
    });
  });

  it("daytime with no mood yet → a one-tap check-in", () => {
    expect(primaryAction({ ...base }, 14).kind).toBe("checkin");
  });

  it("evening, nothing decided → the nightly decision", () => {
    expect(primaryAction({ ...base }, 20).kind).toBe("tonight");
  });
});

describe("orientation helpers", () => {
  it("greeting reads naturally around the clock", () => {
    expect(greeting(8)).toMatch(/morning/i);
    expect(greeting(14)).toMatch(/afternoon/i);
    expect(greeting(19)).toMatch(/evening/i);
    expect(typeof greeting(2)).toBe("string");
  });
  it("partOfDay buckets the hours", () => {
    expect(partOfDay(8)).toBe("morning");
    expect(partOfDay(14)).toBe("afternoon");
    expect(partOfDay(19)).toBe("evening");
    expect(partOfDay(23)).toBe("night");
    expect(partOfDay(2)).toBe("night");
  });
  it("formatLongDate names the weekday and month", () => {
    const label = formatLongDate(new Date(2026, 5, 25, 9, 0, 0).getTime());
    expect(label.toLowerCase()).toContain("june");
    expect(label.toLowerCase()).toContain("thursday");
  });
});
