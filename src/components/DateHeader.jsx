// src/components/DateHeader.jsx
// The orientation line every recovery surface needs: an unmistakable date plus a
// calm, state-aware greeting. "Date clarity is mandatory" — so this is a single
// shared component rather than ad-hoc per-screen markup, and it always answers
// "what day am I looking at?" before anything else loads.
import { formatLongDate, greeting } from "../app/home.js";

export default function DateHeader({ now = Date.now(), sub, hour, className = "" }) {
  const h = hour ?? new Date(now).getHours();
  return (
    <div className={className}>
      <div className="text-pearl-faint text-[11px] uppercase tracking-[0.2em]">{greeting(h)}</div>
      <h1 className="font-display text-[1.7rem] leading-tight text-pearl mt-0.5">{formatLongDate(now)}</h1>
      {sub && <p className="text-sm text-pearl-soft mt-1">{sub}</p>}
    </div>
  );
}
