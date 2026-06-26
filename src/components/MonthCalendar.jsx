// src/components/MonthCalendar.jsx
// The redesigned Progress timeline — a real month calendar, not a legend-gated
// heatmap. It answers "what month/day am I looking at?" at a glance:
//   • a bold month + year header with ‹ › paging (bounded to real history)
//   • weekday columns and a grid where each month starts in its true column
//   • today is ringed; FUTURE days are faint "not yet" (never missing-data);
//     un-logged PAST days are open slots (never failures); logged nights use the
//     same shape+colour status language as the rest of the app.
// Deliberately framer-motion-free so it renders in tests and stays cheap.
import { useMemo } from "react";
import { monthMatrix, monthSummary, weekdayLetters } from "../app/calendar.js";
import { StatusMark } from "./status.jsx";

function Chevron({ dir = "left" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

export default function MonthCalendar({
  year,
  monthIndex,
  daysMap = new Map(),
  now = Date.now(),
  weekStartsOn = 0,
  selectedKey = null,
  onSelectDay,
  onPrev,
  onNext,
  canPrev = true,
  canNext = true,
}) {
  const matrix = useMemo(
    () => monthMatrix(year, monthIndex, daysMap, now, weekStartsOn),
    [year, monthIndex, daysMap, now, weekStartsOn]
  );
  const summary = useMemo(() => monthSummary(matrix), [matrix]);
  const letters = useMemo(() => weekdayLetters(weekStartsOn), [weekStartsOn]);

  return (
    <div className="glass rounded-3xl p-4">
      {/* month pager */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Previous month"
          className="raised rounded-full h-10 w-10 grid place-items-center text-pearl disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition"
        >
          <Chevron dir="left" />
        </button>
        <div className="text-center">
          <div className="font-display text-lg text-pearl leading-tight">{matrix.label}</div>
          <div className="text-[11px] text-pearl-faint">
            {summary.elapsed === 0
              ? "A fresh month"
              : `${summary.clear} of ${summary.elapsed} nights alcohol-free`}
          </div>
        </div>
        <button
          onClick={onNext}
          disabled={!canNext}
          aria-label="Next month"
          className="raised rounded-full h-10 w-10 grid place-items-center text-pearl disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition"
        >
          <Chevron dir="right" />
        </button>
      </div>

      {/* weekday header */}
      <div className="grid grid-cols-7 mt-3 mb-1">
        {letters.map((l, i) => (
          <div key={i} className="text-center text-[10px] uppercase tracking-wider text-pearl-faint">
            {l}
          </div>
        ))}
      </div>

      {/* day grid */}
      <div className="grid grid-cols-7 gap-1">
        {matrix.weeks.flat().map((c) => {
          if (!c.inMonth) return <div key={c.key} aria-hidden />;

          const logged = c.status !== "none";
          const selected = selectedKey === c.dayKey;
          const interactive = !c.isFuture;

          return (
            <button
              key={c.key}
              disabled={!interactive}
              onClick={() => interactive && onSelectDay?.(c)}
              aria-label={`${c.dayKey}${c.isToday ? ", today" : ""}, ${c.isFuture ? "upcoming" : c.status === "none" ? "no entry" : c.status}`}
              aria-current={c.isToday ? "date" : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 min-h-touch transition ${
                interactive ? "active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" : "cursor-default"
              } ${selected ? "ring-2 ring-focus bg-white/5" : ""}`}
            >
              {c.isFuture ? (
                <span className="h-[26px] w-[26px]" style={{ borderRadius: 8, border: "1.5px dashed rgba(244,241,232,0.13)" }} aria-hidden />
              ) : (
                <StatusMark status={c.status} size={26} today={c.isToday} />
              )}
              <span
                className={`text-[11px] tnum leading-none ${
                  c.isToday
                    ? "text-jade font-bold"
                    : c.isFuture
                    ? "text-pearl-faint/50"
                    : logged
                    ? "text-pearl font-medium"
                    : "text-pearl-faint"
                }`}
              >
                {c.dayNum}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
