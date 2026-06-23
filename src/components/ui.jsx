// src/components/ui.jsx — shared, accessible UI primitives.
import { forwardRef, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { tap as hapticTap } from "../app/haptics.js";

export function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

/* ---------------- Button ---------------- */
export const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    className = "",
    onClick,
    disabled,
    type = "button",
    full,
    haptic = true,
    ...rest
  },
  ref
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 min-h-touch font-medium transition-[background-color,box-shadow,filter,color] duration-200 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed select-none";
  const variants = {
    // Vivid gradient fills with a glow halo (defined in index.css).
    primary: "btn-primary font-semibold hover:brightness-105 active:brightness-95",
    warm: "btn-warm font-semibold hover:brightness-105 active:brightness-95",
    wine: "text-pearl bg-wine hover:brightness-110 active:brightness-95 font-semibold shadow-lg shadow-wine/40",
    // Secondary: a SOLID, clearly-elevated surface (no translucency lottery).
    glass: "raised",
    ghost: "text-pearl border border-white/25 hover:bg-white/10",
  };
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.12 }}
      className={cn(base, variants[variant] || variants.primary, full && "w-full", className)}
      disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        if (haptic) hapticTap();
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </motion.button>
  );
});

/* ---------------- Chip (single/multi choice) ----------------
   One shared selected/unselected look so "selected" is obvious and consistent
   everywhere (goal picker, break lengths, etc.) instead of faint per-screen tints. */
export function Chip({ selected, onClick, children, className = "", ariaLabel }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={() => {
        hapticTap();
        onClick?.();
      }}
      className={cn(
        "rounded-2xl px-4 py-2.5 text-sm min-h-touch font-medium transition-[filter,background-color,box-shadow] duration-200",
        selected ? "is-selected font-semibold" : "raised",
        className
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */
export function Card({ children, className = "", as: Tag = "div", ...rest }) {
  return (
    <Tag className={cn("glass rounded-3xl p-5", className)} {...rest}>
      {children}
    </Tag>
  );
}

/* ---------------- Animated number ---------------- */
export function Counter({ value = 0, prefix = "", suffix = "", className = "", duration = 700 }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(0);
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = fromRef.current;
    const to = value;
    if (reduced || from === to) {
      setDisplay(to);
      fromRef.current = to;
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);
  return (
    <span className={cn("tnum", className)}>
      {prefix}
      {Math.round(display).toLocaleString()}
      {suffix}
    </span>
  );
}

/* ---------------- Stat tile ---------------- */
export function MetricTile({ label, children, hint, accent = "pearl", onClick }) {
  const accents = {
    pearl: "text-pearl",
    jade: "text-jade",
    gold: "text-gold",
    amber: "text-amber",
    moonstone: "text-moonstone",
  };
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "glass rounded-2xl p-3.5 text-left flex flex-col gap-0.5 min-h-touch",
        onClick && "active:scale-[0.98] transition-transform"
      )}
    >
      <span className="text-[11px] uppercase tracking-wider text-pearl-faint">{label}</span>
      <span className={cn("text-xl font-semibold tnum leading-tight", accents[accent])}>{children}</span>
      {hint && <span className="text-[11px] text-pearl-faint">{hint}</span>}
    </Comp>
  );
}

/* ---------------- Sparkline (mood 1–5, null = gap) ---------------- */
export function Sparkline({ data = [], width = 240, height = 40, stroke = "var(--color-moonstone)" }) {
  const pts = data.filter((d) => d.mood != null);
  if (pts.length < 2) {
    return (
      <div style={{ width: "100%", maxWidth: width, minHeight: height }} className="flex items-center text-xs text-pearl-faint">
        Not enough check-ins yet — tap a face each day to grow your trend.
      </div>
    );
  }
  const n = data.length;
  const xStep = width / Math.max(1, n - 1);
  const norm = (m) => height - 4 - ((m - 1) / 4) * (height - 8);
  let d = "";
  data.forEach((pt, i) => {
    if (pt.mood == null) return;
    const x = i * xStep;
    const y = norm(pt.mood);
    d += (d === "" ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
  });
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      style={{ maxWidth: width, display: "block" }}
      role="img"
      aria-label="Clarity trend"
    >
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ---------------- Mood faces ---------------- */
export const MOODS = [
  { v: 1, face: "😣", label: "Rough" },
  { v: 2, face: "😕", label: "Meh" },
  { v: 3, face: "😐", label: "Okay" },
  { v: 4, face: "🙂", label: "Good" },
  { v: 5, face: "😌", label: "Great" },
];

export function MoodPicker({ value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-1" role="radiogroup" aria-label="How clear do you feel?">
      {MOODS.map((m) => (
        <button
          key={m.v}
          role="radio"
          aria-checked={value === m.v}
          aria-label={m.label}
          onClick={() => {
            hapticTap();
            onChange?.(m.v);
          }}
          className={cn(
            "flex-1 aspect-square max-w-[58px] min-h-touch min-w-touch rounded-2xl text-2xl grid place-items-center transition-all",
            value === m.v
              ? "is-selected ring-2 ring-jade scale-110"
              : "raised"
          )}
        >
          <span aria-hidden>{m.face}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------------- Stepper ---------------- */
export function Stepper({ value, onChange, min = 0, max = 30, label }) {
  const set = (v) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className="flex items-center gap-3" role="group" aria-label={label || "stepper"}>
      <button
        aria-label={`Decrease ${label || ""}`}
        onClick={() => {
          hapticTap();
          set(value - 1);
        }}
        disabled={value <= min}
        className="raised h-touch w-touch rounded-2xl text-2xl leading-none grid place-items-center active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        −
      </button>
      <span className="tnum text-3xl font-semibold w-12 text-center text-pearl" aria-live="polite">
        {value}
      </span>
      <button
        aria-label={`Increase ${label || ""}`}
        onClick={() => {
          hapticTap();
          set(value + 1);
        }}
        disabled={value >= max}
        className="raised h-touch w-touch rounded-2xl text-2xl leading-none grid place-items-center active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        +
      </button>
    </div>
  );
}

/* ---------------- Labelled range slider ---------------- */
export function Slider({ value, onChange, min = 0, max = 30, step = 1, label, ariaLabel, id }) {
  // Drive the WebKit filled-track gradient (Firefox uses ::-moz-range-progress).
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <label className="block" htmlFor={id}>
      {label && <span className="text-sm text-pearl-soft">{label}</span>}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel || label}
        aria-valuetext={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-jade mt-2"
        style={{ "--range-pct": `${pct}%` }}
      />
    </label>
  );
}

/* ---------------- Amount input ---------------- */
export function AmountField({ value, onChange, currencySymbol = "₹", placeholder = "0", id }) {
  return (
    <div className="flex items-center gap-2 glass rounded-2xl px-4 min-h-touch focus-within:ring-2 focus-within:ring-focus">
      <span className="text-pearl-soft text-lg">{currencySymbol}</span>
      <input
        id={id}
        inputMode="decimal"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-lg tnum placeholder:text-pearl-faint focus:outline-none"
      />
    </div>
  );
}
