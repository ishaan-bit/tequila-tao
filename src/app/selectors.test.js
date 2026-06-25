// Correctness guarantees for the event-log economy. These are the rules the
// redesign must never break: re-logging a night can't double-count, editing a
// night propagates everywhere, and a drink never erases earned history.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { addEvent, removeEvent, updateProfile, clearAll, getState } from "./store.js";
import { computeStats, buildDays, dayStatus, localDayKey } from "./selectors.js";

const DAY_MS = 86400000;
const NOW = new Date(2026, 5, 25, 20, 0, 0).getTime(); // Thu 25 Jun 2026, 8pm local
const daysAgo = (n) => NOW - n * DAY_MS;
const stats = () => computeStats(getState());

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  clearAll();
});
afterEach(() => vi.useRealTimers());

describe("per-day idempotency (no double counting)", () => {
  it("counts a night once even if logged twice; the latest payload wins", () => {
    addEvent("clear_night", { moneySaved: 1000, drinksAvoided: 3 }, daysAgo(0));
    addEvent("clear_night", { moneySaved: 1200, drinksAvoided: 4 }, daysAgo(0));
    const s = stats();
    expect(s.clearNights).toBe(1); // one night, not two
    expect(s.moneyKept).toBe(1200); // last log wins, not summed to 2200
    expect(s.drinksAvoided).toBe(4);
  });

  it("a drink on a day that also has a clear log is never counted as clear", () => {
    addEvent("clear_night", { moneySaved: 1000, drinksAvoided: 3 }, daysAgo(0));
    addEvent("drink_night", { drinks: 4 }, daysAgo(0));
    const s = stats();
    expect(s.clearNights).toBe(0);
    expect(s.drinkNights).toBe(1);
    expect(s.moneyKept).toBe(0);
    expect(s.totalDrinks).toBe(4);
  });
});

describe("editing a night propagates to every dependent surface", () => {
  it("alcohol-free → edit → drank flips counts, money and streak", () => {
    const clear = addEvent("clear_night", { moneySaved: 1500, drinksAvoided: 3 }, daysAgo(0));
    let s = stats();
    expect(s.clearNights).toBe(1);
    expect(s.moneyKept).toBe(1500);
    expect(s.currentClearStreak).toBe(1);

    // The real correction flow: remove that day's clear, add a drink for the day.
    removeEvent(clear.id);
    addEvent("drink_night", { drinks: 4 }, daysAgo(0));
    s = stats();
    expect(s.clearNights).toBe(0);
    expect(s.drinkNights).toBe(1);
    expect(s.moneyKept).toBe(0); // the clear's money is gone, not stranded
    expect(s.totalDrinks).toBe(4);
    expect(s.currentClearStreak).toBe(0);
  });
});

describe("a drink never erases earned history", () => {
  it("keeps best streak and prior money after a slip", () => {
    addEvent("clear_night", { moneySaved: 1000, drinksAvoided: 2 }, daysAgo(3));
    addEvent("clear_night", { moneySaved: 1000, drinksAvoided: 2 }, daysAgo(2));
    addEvent("clear_night", { moneySaved: 1000, drinksAvoided: 2 }, daysAgo(1));
    addEvent("drink_night", { drinks: 5 }, daysAgo(0));
    const s = stats();
    expect(s.currentClearStreak).toBe(0); // current run paused
    expect(s.bestClearStreak).toBe(3); // best is preserved
    expect(s.moneyKept).toBe(3000); // the three clear nights still count
  });
});

describe("future-dated events are ignored, not summed", () => {
  it("a clear night 5 days in the future does not count today", () => {
    addEvent("clear_night", { moneySaved: 999, drinksAvoided: 9 }, daysAgo(-5));
    const s = stats();
    expect(s.clearNights).toBe(0);
    expect(s.moneyKept).toBe(0);
  });
});

describe("dayStatus is one unambiguous status per day", () => {
  it("maps each kind of night to its own status", () => {
    const events = [
      addEvent("clear_night", {}, daysAgo(4)),
      addEvent("drink_night", { drinks: 2 }, daysAgo(3)),
      addEvent("drink_night", { drinks: 2, frozen: true }, daysAgo(2)),
      addEvent("mood_checkin", { mood: 3 }, daysAgo(1)),
    ];
    const days = buildDays(getState().events, NOW);
    expect(dayStatus(days.get(localDayKey(events[0].ts)))).toBe("clear");
    expect(dayStatus(days.get(localDayKey(events[1].ts)))).toBe("drank");
    expect(dayStatus(days.get(localDayKey(events[2].ts)))).toBe("frozen");
    expect(dayStatus(days.get(localDayKey(events[3].ts)))).toBe("rest");
    expect(dayStatus(undefined)).toBe("none");
  });
});

describe("abstinence sober run resets on any drink (quit goal)", () => {
  it("counts days off alcohol and zeroes on a slip while keeping best", () => {
    updateProfile({ intent: "quit", goalStart: daysAgo(3) });
    let s = stats();
    expect(s.isAbstinence).toBe(true);
    expect(s.soberDays).toBe(4); // anchor day .. today, inclusive, no drinks

    addEvent("drink_night", { drinks: 3 }, daysAgo(0));
    s = stats();
    expect(s.soberDays).toBe(0);
    expect(s.bestSoberRun).toBeGreaterThanOrEqual(3); // the pre-slip run is kept
  });
});

describe("softLandingToday reflects a morning-after log", () => {
  it("is false until a soft_landing is logged today", () => {
    expect(stats().softLandingToday).toBe(false);
    addEvent("soft_landing", { mood: 3 }, daysAgo(0));
    expect(stats().softLandingToday).toBe(true);
  });
});
