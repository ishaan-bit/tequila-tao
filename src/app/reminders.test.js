// The reminder rules decide WHEN each notification fires and WHAT it says.
// These pin the eligibility logic (so the daily check-in and the sparse
// drink-limit nudge can't drift) and the goal-adaptive, non-shaming copy.
import { describe, it, expect } from "vitest";
import {
  parseHM,
  nextOccurrences,
  checkinDue,
  nudgeDueNow,
  nudgeReminder,
  limitNudge,
  NUDGE_WEEKDAYS,
} from "./reminders.js";

// A fixed Saturday and a fixed Wednesday at known clock times for determinism.
// (June 2026: 27th is a Saturday, 24th a Wednesday.)
const sat = (h, m = 0) => new Date(2026, 5, 27, h, m, 0, 0).getTime();
const wed = (h, m = 0) => new Date(2026, 5, 24, h, m, 0, 0).getTime();

describe("parseHM", () => {
  it("parses and clamps, defaulting to 21:00 on garbage", () => {
    expect(parseHM("09:30")).toEqual({ hour: 9, minute: 30 });
    expect(parseHM("7:5")).toEqual({ hour: 7, minute: 5 });
    expect(parseHM("99:99")).toEqual({ hour: 23, minute: 59 });
    expect(parseHM("")).toEqual({ hour: 21, minute: 0 });
    expect(parseHM(undefined)).toEqual({ hour: 21, minute: 0 });
  });
});

describe("nextOccurrences", () => {
  it("returns future-only daily slots at the given time", () => {
    const out = nextOccurrences("21:00", 3, { from: wed(22, 0) }); // today's slot passed
    expect(out).toHaveLength(3);
    out.forEach((ts) => {
      expect(ts).toBeGreaterThan(wed(22, 0));
      expect(new Date(ts).getHours()).toBe(21);
    });
    // consecutive days
    expect(out[1] - out[0]).toBe(24 * 3600 * 1000);
  });

  it("restricts to the going-out weekdays when asked", () => {
    const out = nextOccurrences("19:00", 4, { weekdays: NUDGE_WEEKDAYS, from: wed(8) });
    expect(out).toHaveLength(4);
    out.forEach((ts) => expect(NUDGE_WEEKDAYS).toContain(new Date(ts).getDay()));
  });
});

describe("checkinDue", () => {
  const settings = { dailyReminder: true, reminderTime: "21:00" };
  const fresh = { moodToday: null, decidedToday: false };

  it("is due once the time passes and nothing was logged today", () => {
    expect(checkinDue(fresh, settings, wed(21, 30))).toBe(true);
  });
  it("is not due before the chosen time", () => {
    expect(checkinDue(fresh, settings, wed(20, 0))).toBe(false);
  });
  it("is silenced once the user shows up (mood or a decision)", () => {
    expect(checkinDue({ moodToday: 3, decidedToday: false }, settings, wed(22))).toBe(false);
    expect(checkinDue({ moodToday: null, decidedToday: true }, settings, wed(22))).toBe(false);
  });
  it("respects the off switch", () => {
    expect(checkinDue(fresh, { ...settings, dailyReminder: false }, wed(22))).toBe(false);
  });
});

describe("nudgeDueNow", () => {
  const on = { drinkLimitNudge: true };
  it("fires on a going-out evening (Sat after 7pm)", () => {
    expect(nudgeDueNow(on, sat(20))).toBe(true);
  });
  it("does not fire earlier in the day", () => {
    expect(nudgeDueNow(on, sat(12))).toBe(false);
  });
  it("does not fire midweek (Wed)", () => {
    expect(nudgeDueNow(on, wed(20))).toBe(false);
  });
  it("respects the off switch", () => {
    expect(nudgeDueNow({ drinkLimitNudge: false }, sat(20))).toBe(false);
  });
});

describe("nudgeReminder copy is goal-adaptive", () => {
  it("cutback restates the user's own limit + plan, no shame", () => {
    const r = nudgeReminder({ intent: "cutback", typicalSession: 2, intention: { plan: "soda & lime" } });
    expect(r.body).toMatch(/soda & lime/);
    expect(r.body).toMatch(/2/);
    expect(r.body.toLowerCase()).not.toMatch(/limit reached|stop|don't/);
  });
  it("abstinence goals get a stay-clear framing with no drink-limit language", () => {
    const q = nudgeReminder({ intent: "quit" });
    expect(q.body.toLowerCase()).not.toMatch(/limit|drinks?/);
    expect(q.body.toLowerCase()).toMatch(/clarity|run/);
  });
});

describe("limitNudge (in-flow soft cap)", () => {
  const profile = { intent: "cutback", typicalSession: 3 };
  const on = { drinkLimitNudge: true };
  it("is silent at or under the usual limit", () => {
    expect(limitNudge(3, profile, on)).toBeNull();
    expect(limitNudge(1, profile, on)).toBeNull();
  });
  it("gently flags going over, naming the limit", () => {
    const msg = limitNudge(5, profile, on);
    expect(msg).toMatch(/above your usual 3/i);
    expect(msg.toLowerCase()).toContain("no judgment");
  });
  it("stays quiet when the nudge is off or the goal is abstinence", () => {
    expect(limitNudge(9, profile, { drinkLimitNudge: false })).toBeNull();
    expect(limitNudge(9, { intent: "quit", typicalSession: 3 }, on)).toBeNull();
  });
});
