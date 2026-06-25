// src/components/DayStrip.jsx — the scrollable nightly timeline on Home.
// A horizontal rail of recent days (oldest → today), each a tappable cell that
// reads its status by SHAPE + colour + label. Tapping a day opens a calm
// inspector: a logged day shows what happened (with Undo handled on Home for the
// just-logged one); an UNLOGGED past day lets you backfill it, so a forgotten
// night doesn't leave a permanent grey hole. EMA self-monitoring works only if
// the record can be made complete — but it is always an offer, never a nag.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dayLabel } from "../app/selectors.js";
import { StatusMark, StatusLegend, STATUS } from "./status.jsx";
import { Sheet } from "./ui.jsx";
import DayDetail from "./DayDetail.jsx";

function weekdayInitial(dayKey) {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);
}
function dayNum(dayKey) {
  return Number(dayKey.split("-")[2]);
}

export default function DayStrip({ days = [], lastLoggedDay = null, currency = "INR" }) {
  const navigate = useNavigate();
  const railRef = useRef(null);
  const cellRefs = useRef([]);
  const [sel, setSel] = useState(null); // { day, status, ... } open in inspector
  const [focusIdx, setFocusIdx] = useState(days.length - 1);

  // Anchor on today: scroll the rail to its right edge on mount / when days grow.
  useEffect(() => {
    const el = railRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
    setFocusIdx(days.length - 1);
  }, [days.length]);

  const onKeyDown = (e, i) => {
    let next = i;
    if (e.key === "ArrowRight") next = Math.min(days.length - 1, i + 1);
    else if (e.key === "ArrowLeft") next = Math.max(0, i - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = days.length - 1;
    else return;
    e.preventDefault();
    setFocusIdx(next);
    cellRefs.current[next]?.focus();
    cellRefs.current[next]?.scrollIntoView({ block: "nearest", inline: "center" });
  };

  const logFor = (path, day) => {
    setSel(null);
    navigate(path, { state: { forDay: day } });
  };

  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-sm text-pearl-soft">Your nights</div>
        <div className="text-[11px] text-pearl-faint">tap a day to log or look back</div>
      </div>

      <div
        ref={railRef}
        role="group"
        aria-label="Recent nights — scroll for more history"
        className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-1 px-1"
      >
        {days.map((d, i) => {
          const justLogged = d.day === lastLoggedDay;
          return (
            <button
              key={d.day}
              ref={(el) => (cellRefs.current[i] = el)}
              tabIndex={i === focusIdx ? 0 : -1}
              onKeyDown={(e) => onKeyDown(e, i)}
              onClick={() => setSel(d)}
              aria-label={`${dayLabel(d.day)}: ${STATUS[d.status]?.label || d.status}${d.isToday ? ", today" : ""}`}
              className="snap-end shrink-0 flex flex-col items-center gap-1 rounded-2xl px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <DayMark status={d.status} today={d.isToday} pop={justLogged} />
              <span className={`text-[10px] leading-none ${d.isToday ? "text-jade font-semibold" : "text-pearl-faint"}`}>
                {weekdayInitial(d.day)}
              </span>
              <span className={`text-[11px] tnum leading-none ${d.isToday ? "text-pearl font-semibold" : "text-pearl-soft"}`}>
                {dayNum(d.day)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-white/10">
        <StatusLegend />
      </div>

      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel ? dayLabel(sel.day) : ""}>
        {sel && (
          <DayDetail
            day={{ ...sel, dayKey: sel.day, isFuture: false }}
            currency={currency}
            onLog={logFor}
            onDecide={() => {
              setSel(null);
              navigate("/crossroads");
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

// A status mark that gives a one-shot, reduced-motion-safe scale-pop the first
// render after it becomes the just-logged day.
function DayMark({ status, today, pop }) {
  const [popped, setPopped] = useState(false);
  useEffect(() => {
    if (!pop) return;
    setPopped(true);
    const t = setTimeout(() => setPopped(false), 520);
    return () => clearTimeout(t);
  }, [pop]);
  return (
    <span className={popped ? "day-pop" : ""} style={{ display: "inline-block" }}>
      <StatusMark status={status} size={34} today={today} />
    </span>
  );
}

