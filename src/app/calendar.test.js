// The calendar model is the centrepiece of the Progress redesign — month
// boundaries, "today", and especially the future-vs-no-entry distinction all
// live here, so they're pinned down with tests rather than eyeballed in the UI.
import { describe, it, expect } from "vitest";
import { localDayKey } from "./selectors.js";
import {
  monthMatrix,
  monthSummary,
  weekdayLetters,
  shiftMonth,
  compareMonth,
  currentMonth,
  firstActivityMonth,
  monthShort,
} from "./calendar.js";

const at = (y, m, d) => new Date(y, m, d, 12, 0, 0).getTime();
const NOW = at(2026, 5, 15); // Mon 15 Jun 2026, midday

describe("monthMatrix structure & boundaries", () => {
  const matrix = monthMatrix(2026, 5, new Map(), NOW); // June 2026

  it("is whole weeks of 7", () => {
    expect(matrix.weeks.length).toBeGreaterThanOrEqual(4);
    for (const w of matrix.weeks) expect(w).toHaveLength(7);
  });

  it("contains exactly the month's days as in-month cells", () => {
    const inMonth = matrix.weeks.flat().filter((c) => c.inMonth);
    expect(inMonth).toHaveLength(30); // June has 30 days
    expect(inMonth[0].dayNum).toBe(1);
    expect(inMonth[29].dayNum).toBe(30);
    // No day 31 leaks in from an adjacent month.
    expect(inMonth.some((c) => c.dayNum === 31)).toBe(false);
  });

  it("pads the lead with empty spacers so the month starts in the right column", () => {
    const firstWeek = matrix.weeks[0];
    const firstReal = firstWeek.findIndex((c) => c.inMonth);
    // every slot before the first real day is a non-month spacer
    for (let i = 0; i < firstReal; i++) expect(firstWeek[i].inMonth).toBe(false);
    // 2026-06-01 is a Monday; with Sunday-start weeks that's column index 1.
    expect(firstReal).toBe(1);
  });

  it("labels the month unmistakably", () => {
    expect(matrix.label).toMatch(/2026/);
    expect(matrix.label.toLowerCase()).toContain("june");
  });
});

describe("today, future and no-entry are distinct", () => {
  // A clear night on the 10th, nothing on the 12th, today is the 15th.
  const days = new Map([[localDayKey(at(2026, 5, 10)), { clear: true, any: true, clearMoney: 800, clearDrinks: 2 }]]);
  const matrix = monthMatrix(2026, 5, days, NOW);
  const cell = (n) => matrix.weeks.flat().find((c) => c.inMonth && c.dayNum === n);

  it("marks exactly one day as today", () => {
    const todays = matrix.weeks.flat().filter((c) => c.isToday);
    expect(todays).toHaveLength(1);
    expect(todays[0].dayNum).toBe(15);
  });

  it("a logged past day carries its status and payload", () => {
    expect(cell(10).status).toBe("clear");
    expect(cell(10).isFuture).toBe(false);
    expect(cell(10).moneySaved).toBe(800);
  });

  it("an un-logged PAST day is 'none' but NOT future (never a gap-as-failure)", () => {
    expect(cell(12).status).toBe("none");
    expect(cell(12).isFuture).toBe(false);
  });

  it("a FUTURE day is flagged future and never looks like missing data", () => {
    expect(cell(20).isFuture).toBe(true);
    expect(cell(20).status).toBe("none");
    expect(cell(15).isFuture).toBe(false); // today is not future
  });
});

describe("monthSummary counts only elapsed in-month days", () => {
  it("excludes future days so an in-progress month reads honestly", () => {
    const days = new Map([
      [localDayKey(at(2026, 5, 10)), { clear: true, any: true }],
      [localDayKey(at(2026, 5, 11)), { drinkUnfrozen: true, any: true, drinkCount: 3 }],
    ]);
    const sum = monthSummary(monthMatrix(2026, 5, days, NOW));
    expect(sum.clear).toBe(1);
    expect(sum.drank).toBe(1);
    expect(sum.elapsed).toBe(15); // 1st..15th
    expect(sum.logged).toBe(2);
  });
});

describe("month navigation helpers", () => {
  it("weekdayLetters returns 7 and respects the start day", () => {
    expect(weekdayLetters(0)).toHaveLength(7);
    expect(weekdayLetters(1)).toHaveLength(7);
    expect(weekdayLetters(0)[0]).not.toBe(weekdayLetters(1)[0]);
  });

  it("shiftMonth rolls over year boundaries", () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, monthIndex: 11 });
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, monthIndex: 0 });
  });

  it("compareMonth orders months", () => {
    expect(compareMonth({ year: 2026, monthIndex: 4 }, { year: 2026, monthIndex: 5 })).toBe(-1);
    expect(compareMonth({ year: 2026, monthIndex: 5 }, { year: 2026, monthIndex: 5 })).toBe(0);
    expect(compareMonth({ year: 2027, monthIndex: 0 }, { year: 2026, monthIndex: 11 })).toBe(1);
  });

  it("currentMonth and firstActivityMonth bound the pager", () => {
    expect(currentMonth(NOW)).toEqual({ year: 2026, monthIndex: 5 });
    const events = [{ ts: at(2026, 2, 3) }, { ts: at(2026, 5, 1) }];
    expect(firstActivityMonth(events, NOW)).toEqual({ year: 2026, monthIndex: 2 }); // March
    expect(firstActivityMonth([], NOW)).toEqual({ year: 2026, monthIndex: 5 }); // falls back to now
  });

  it("monthShort is a short label", () => {
    expect(monthShort(2026, 5).toLowerCase()).toContain("jun");
  });
});
