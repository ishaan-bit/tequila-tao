// src/components/DayDetail.jsx
// The humane "story of a night", shown when a day is tapped (in the Progress
// calendar or the Home day strip). Presentational and router-free so it's easy
// to test: it renders a day's status, what it meant, and the kind next step —
// inspecting, backfilling a forgotten night, or correcting a mistaken log.
// Future nights say "not here yet" instead of offering to log the unknowable.
import { dayLabel } from "../app/selectors.js";
import { money } from "../app/format.js";
import { StatusMark, STATUS } from "./status.jsx";
import { MOODS } from "./ui.jsx";
import { Button } from "./ui.jsx";

function story(day, currency) {
  switch (day.status) {
    case "clear":
      return day.moneySaved > 0
        ? `An alcohol-free night — ${money(day.moneySaved, currency)} kept and ${day.drinksAvoided} ${day.drinksAvoided === 1 ? "drink" : "drinks"} not had.`
        : "An alcohol-free night. Counted and kept.";
    case "drank":
      return `${day.drinks || "A few"} ${day.drinks === 1 ? "drink" : "drinks"} logged. No shame — your history is safe and your best run still stands.`;
    case "frozen":
      return "A planned night you chose in advance — your streak stayed protected.";
    case "rest":
      return "You checked in. Showing up is the habit.";
    default:
      return day.isToday
        ? "Tonight isn't decided yet. There's no wrong choice — just an honest one."
        : "Nothing logged for this night. It's never too late to fill it in.";
  }
}

export default function DayDetail({ day, currency = "INR", onLog, onDecide }) {
  const meta = STATUS[day.status] || STATUS.none;
  const logged = day.status !== "none";
  const mood = day.mood != null ? MOODS.find((m) => m.v === day.mood) : null;

  // A night that hasn't happened — never frame the unknown as missing data.
  if (day.isFuture) {
    return (
      <div className="space-y-3" data-testid="day-detail">
        <div className="flex items-center gap-3">
          <StatusMark status="none" size={40} />
          <div>
            <div className="text-pearl font-medium">{dayLabel(day.dayKey)}</div>
            <div className="text-sm text-pearl-soft">This night hasn't arrived yet.</div>
          </div>
        </div>
        <p className="text-sm text-pearl-faint">Come back when it's here — one night at a time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="day-detail">
      <div className="flex items-start gap-3">
        <StatusMark status={day.status} size={40} today={day.isToday} />
        <div className="flex-1">
          <div className="text-pearl font-medium capitalize">{logged ? meta.label : dayLabel(day.dayKey)}</div>
          <p className="text-sm text-pearl-soft mt-0.5">{story(day, currency)}</p>
          {mood && (
            <div className="text-sm text-pearl-faint mt-1">
              Felt: <span aria-hidden>{mood.face}</span> {mood.label}
            </div>
          )}
        </div>
      </div>

      {day.isToday && !logged ? (
        <div className="space-y-2.5">
          <Button variant="primary" full onClick={onDecide}>
            Decide tonight
          </Button>
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="glass" onClick={() => onLog?.("/clarity", day.dayKey)}>
              Alcohol-free
            </Button>
            <Button variant="glass" onClick={() => onLog?.("/sendoff", day.dayKey)}>
              I'm drinking
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="glass" onClick={() => onLog?.("/clarity", day.dayKey)}>
            {logged ? "Mark alcohol-free" : "Alcohol-free"}
          </Button>
          <Button variant="glass" onClick={() => onLog?.("/sendoff", day.dayKey)}>
            I drank
          </Button>
        </div>
      )}

      {logged && (
        <p className="text-center text-[11px] text-pearl-faint">
          Re-logging just updates this night — it never double-counts.
        </p>
      )}
    </div>
  );
}
