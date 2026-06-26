// src/components/status.jsx — the ONE visual language for a logged day's status,
// reused by the Home day-strip, the Progress heatmap, and their legends.
// Meaning is never carried by colour alone (WCAG 1.4.1): every state also has a
// distinct SHAPE (glyph) and an accessible text label, so it reads under colour
// blindness and to screen readers. jade/sage/slate are neighbouring blue-greens
// that collapse to identical greys under common CVD — the glyph is what
// disambiguates them.

export const STATUS = {
  clear: { color: "var(--color-jade)", fg: "var(--color-ink)", label: "alcohol-free" },
  frozen: { color: "var(--color-moonstone)", fg: "var(--color-ink)", label: "protected" },
  drank: { color: "var(--color-slate)", fg: "var(--color-pearl)", label: "drank" },
  rest: { color: "var(--color-sage)", fg: "var(--color-ink)", label: "checked in" },
  none: { color: "transparent", fg: "var(--color-pearl-faint)", label: "no entry" },
};

// Distinct shapes per state. Stroked so they read at any size.
function Glyph({ status, stroke = 2.4 }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (status) {
    case "clear": // check
      return <path d="M5 12.5l4 4 10-10.5" {...common} />;
    case "frozen": // shield
      return <path d="M12 3.5l6.5 2.6v4.4c0 3.8-2.8 6.7-6.5 7.6-3.7-.9-6.5-3.8-6.5-7.6V6.1z" {...common} />;
    case "drank": // minus
      return <path d="M6 12h12" {...common} />;
    case "rest": // hollow ring
      return <circle cx="12" cy="12" r="4.5" {...common} />;
    default: // none — nothing (the dashed outline carries it)
      return null;
  }
}

/** A filled rounded-square status mark with its distinct glyph. */
export function StatusMark({ status = "none", size = 30, today = false, className = "" }) {
  const s = STATUS[status] || STATUS.none;
  const isNone = status === "none";
  return (
    <span
      className={className}
      aria-hidden
      style={{
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.32),
        background: isNone ? "rgba(255,255,255,0.045)" : s.color,
        color: s.fg,
        border: isNone ? "1.5px dashed rgba(244,241,232,0.28)" : today ? "1.5px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.14)",
        boxShadow: isNone ? "inset 0 1px 0 0 rgba(255,255,255,0.05)" : "inset 0 1px 0 0 rgba(255,255,255,0.25), 0 4px 10px -7px rgba(0,0,0,0.8)",
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" style={{ display: "block" }}>
        <Glyph status={status} />
      </svg>
    </span>
  );
}

/** An inline pill — status mark + word — for day details and inline context.
   Meaning is carried by the mark's shape+colour AND the label, never colour
   alone. */
export function StatusChip({ status = "none", className = "" }) {
  const meta = STATUS[status] || STATUS.none;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 pl-1 pr-3 py-1 text-xs font-medium text-pearl-soft ${className}`}
    >
      <StatusMark status={status} size={18} />
      <span className="capitalize">{meta.label}</span>
    </span>
  );
}

/** Small swatch + glyph + label, for legends. */
export function StatusLegend({ items = ["clear", "rest", "drank", "frozen", "none"], className = "" }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] text-pearl-soft ${className}`}>
      {items.map((k) => (
        <span key={k} className="flex items-center gap-1.5">
          <StatusMark status={k} size={16} />
          {STATUS[k]?.label || k}
        </span>
      ))}
    </div>
  );
}
