// src/app/calendar.js
// Pure month-calendar model for the Progress timeline. No store access, no React
// — just functions of (year, month, day-rollup) so the whole thing is unit
// testable. This is the layer that makes month boundaries, "today", and the
// future-vs-no-entry distinction unambiguous, which was the hardest information
// design problem in the app.
import { localDayKey, dayStatus } from "./selectors.js";

const DAY_MS = 86400000;

/** "June 2026" — the unmistakable month/year context every timeline needs. */
export function monthLabel(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/** Short "Jun" form for compact chips/headers. */
export function monthShort(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleDateString(undefined, { month: "short" });
}

/**
 * Locale-correct single-letter weekday headers, honouring the week start
 * (0 = Sunday, 1 = Monday). 2023-01-01 was a Sunday — a stable anchor so this
 * never depends on "now".
 */
export function weekdayLetters(weekStartsOn = 0) {
  const base = new Date(2023, 0, 1).getTime(); // Sunday
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base + ((weekStartsOn + i) % 7) * DAY_MS);
    out.push(d.toLocaleDateString(undefined, { weekday: "narrow" }));
  }
  return out;
}

/** {year, monthIndex} for the month containing `now`. */
export function currentMonth(now = Date.now()) {
  const d = new Date(now);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
}

/** Step a {year, monthIndex} by `delta` months (handles year rollover). */
export function shiftMonth(year, monthIndex, delta) {
  const d = new Date(year, monthIndex + delta, 1);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
}

/** -1 | 0 | 1 ordering for two {year, monthIndex}. */
export function compareMonth(a, b) {
  if (a.year !== b.year) return a.year < b.year ? -1 : 1;
  if (a.monthIndex !== b.monthIndex) return a.monthIndex < b.monthIndex ? -1 : 1;
  return 0;
}

/**
 * The month of the earliest event — the backward bound for paging (there's no
 * point letting the user page into empty months before they ever used the app).
 * Falls back to the current month when there's no history yet.
 */
export function firstActivityMonth(events = [], now = Date.now()) {
  let min = Infinity;
  for (const e of events) {
    if (e && Number.isFinite(e.ts) && e.ts < min) min = e.ts;
  }
  const d = new Date(Number.isFinite(min) ? min : now);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
}

/**
 * Build one month as weeks of 7 cells. Slots outside the month are
 * `{ inMonth: false }` spacers so each month's grid starts in the correct
 * weekday column — that empty leading offset is exactly what makes a month
 * boundary visually obvious (no more wondering where one month ends).
 *
 * Each in-month cell carries everything the UI and the day-detail need:
 *   - isToday / isFuture  (future days render as "not yet", never as a gap/failure)
 *   - status              ("clear" | "drank" | "frozen" | "rest" | "none")
 *   - mood + the logged money/drinks payload for the detail sheet
 */
export function monthMatrix(year, monthIndex, daysMap = new Map(), now = Date.now(), weekStartsOn = 0) {
  const todayKey = localDayKey(now);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIndex, 1).getDay(); // 0 = Sun
  const leadOffset = (firstWeekday - weekStartsOn + 7) % 7;

  const cells = [];
  for (let i = 0; i < leadOffset; i++) cells.push({ inMonth: false, key: `lead-${year}-${monthIndex}-${i}` });

  for (let d = 1; d <= daysInMonth; d++) {
    const dayKey = localDayKey(new Date(year, monthIndex, d).getTime());
    const o = daysMap.get(dayKey);
    cells.push({
      inMonth: true,
      key: dayKey,
      dayKey,
      dayNum: d,
      isToday: dayKey === todayKey,
      // dayKeys are zero-padded YYYY-MM-DD, so a lexicographic compare is a
      // correct, TZ-stable "is this day after today?" check.
      isFuture: dayKey > todayKey,
      status: dayStatus(o),
      mood: o?.mood ?? null,
      moneySaved: o?.clearMoney || 0,
      drinksAvoided: o?.clearDrinks || 0,
      drinks: o?.drinkCount || 0,
      any: !!o?.any,
    });
  }
  while (cells.length % 7 !== 0) cells.push({ inMonth: false, key: `trail-${year}-${monthIndex}-${cells.length}` });

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return { year, monthIndex, label: monthLabel(year, monthIndex), weeks, daysInMonth };
}

/**
 * Roll a month matrix up into the counts a humane header wants ("12 of 19
 * nights alcohol-free this month"). Future and out-of-month cells never count,
 * so an in-progress month reads honestly rather than looking half-failed.
 */
export function monthSummary(matrix) {
  let clear = 0,
    drank = 0,
    frozen = 0,
    rest = 0,
    logged = 0,
    elapsed = 0;
  for (const week of matrix.weeks) {
    for (const c of week) {
      if (!c.inMonth || c.isFuture) continue;
      elapsed++;
      if (c.status === "clear") clear++;
      else if (c.status === "drank") drank++;
      else if (c.status === "frozen") frozen++;
      else if (c.status === "rest") rest++;
      if (c.status !== "none") logged++;
    }
  }
  return { clear, drank, frozen, rest, logged, elapsed };
}
