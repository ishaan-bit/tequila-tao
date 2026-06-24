// src/components/ui.jsx — shared, accessible UI primitives.
import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { tap as hapticTap } from "../app/haptics.js";
import { useReducedMotion } from "../app/motion.js";

export function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

/* ---------------- Button ----------------
   variant: primary | warm | wine | glass (raised secondary) | ghost
   size:    md (44px floor) | lg (56px comfortable target for top CTAs) */
export const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
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
  const reduced = useReducedMotion();
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 font-medium transition-[background-color,box-shadow,filter,color] duration-200 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed select-none";
  const sizes = { md: "min-h-touch", lg: "min-h-touch-lg text-[1.0625rem]" };
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
      whileTap={disabled || reduced ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.12 }}
      className={cn(base, sizes[size] || sizes.md, variants[variant] || variants.primary, full && "w-full", className)}
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
export function Sparkline({ data = [], width = 240, height = 40, stroke = "var(--color-moonstone)", ariaLabel }) {
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
      aria-label={ariaLabel || "Clarity trend"}
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

export function MoodPicker({ value, onChange, label = "How are you feeling?" }) {
  const reduced = useReducedMotion();
  const refs = useRef([]);
  // Roving tabindex: only one face is a tab stop; arrows move between them.
  const move = (from, dir) => {
    const next = (from + dir + MOODS.length) % MOODS.length;
    const m = MOODS[next];
    hapticTap();
    onChange?.(m.v);
    refs.current[next]?.focus();
  };
  return (
    <div className="flex items-center justify-between gap-1" role="radiogroup" aria-label={label}>
      {MOODS.map((m, i) => {
        const selected = value === m.v;
        return (
          <button
            key={m.v}
            ref={(el) => (refs.current[i] = el)}
            role="radio"
            aria-checked={selected}
            aria-label={m.label}
            tabIndex={selected || (value == null && i === 0) ? 0 : -1}
            onClick={() => {
              hapticTap();
              onChange?.(m.v);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                move(i, 1);
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                move(i, -1);
              }
            }}
            className={cn(
              "flex-1 aspect-square max-w-[58px] min-h-touch min-w-touch rounded-2xl text-2xl grid place-items-center transition-[background-color,box-shadow,transform] duration-200",
              selected ? cn("is-selected ring-2 ring-jade", !reduced && "scale-110") : "raised"
            )}
          >
            <span aria-hidden>{m.face}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Stepper ---------------- */
export function Stepper({ value, onChange, min = 0, max = 30, label }) {
  const set = (v) => onChange(Math.max(min, Math.min(max, v)));
  const noun = label || "value";
  return (
    <div className="flex items-center gap-3" role="group" aria-label={label || "stepper"}>
      <button
        aria-label={`Decrease ${noun}`}
        onClick={() => {
          hapticTap();
          set(value - 1);
        }}
        disabled={value <= min}
        className="raised h-touch w-touch rounded-2xl text-2xl leading-none grid place-items-center active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        −
      </button>
      <span className="tnum text-3xl font-semibold w-12 text-center text-pearl" aria-hidden>
        {value}
      </span>
      <span className="sr-only" aria-live="polite">{`${value} ${noun}`}</span>
      <button
        aria-label={`Increase ${noun}`}
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
export function AmountField({ value, onChange, currencySymbol = "₹", placeholder = "0", id, ariaLabel }) {
  return (
    <div className="flex items-center gap-2 glass rounded-2xl px-4 min-h-touch focus-within:ring-2 focus-within:ring-focus">
      <span className="text-pearl-soft text-lg" aria-hidden>
        {currencySymbol}
      </span>
      <input
        id={id}
        inputMode="decimal"
        pattern="[0-9]*"
        aria-label={ariaLabel || `Amount in ${currencySymbol}`}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-lg tnum placeholder:text-pearl-faint focus:outline-none"
      />
    </div>
  );
}

/* ---------------- WhenToggle ----------------
   Tonight / Last night chooser for the logging flows, so a forgotten night can
   be backfilled onto yesterday instead of leaving a permanent grey hole. */
export function WhenToggle({ value, onChange }) {
  return (
    <div className="flex gap-2" role="group" aria-label="When did this happen?">
      <Chip selected={value === "today"} className="flex-1" onClick={() => onChange("today")}>
        Tonight
      </Chip>
      <Chip selected={value === "last"} className="flex-1" onClick={() => onChange("last")}>
        Last night
      </Chip>
    </div>
  );
}

/* ---------------- Sheet ----------------
   A calm bottom sheet with a focus trap, Escape-to-close, return-focus, and a
   background-scroll lock. Used for the day inspector and import choices so the
   user is never trapped without a clear, accessible exit (trauma-informed: keep
   control + an obvious way out). */
export function Sheet({ open, onClose, title, children }) {
  const reduced = useReducedMotion();
  const panelRef = useRef(null);
  const prevFocus = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // lock background scroll
    const t = setTimeout(() => {
      const focusables = panelRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (focusables?.[0] || panelRef.current)?.focus();
    }, 40);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      if (prevFocus.current?.focus) prevFocus.current.focus();
    };
  }, [open]);

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose?.();
      return;
    }
    if (e.key !== "Tab") return;
    const f = panelRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!f || f.length === 0) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: "rgba(8,11,20,0.66)", backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
          onKeyDown={onKeyDown}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            className="glass-strong w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 pb-safe focus:outline-none"
            initial={reduced ? { opacity: 0 } : { y: 40, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: 40, opacity: 0 }}
            transition={reduced ? { duration: 0.12 } : { type: "spring", stiffness: 280, damping: 30 }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" aria-hidden />
            {title && (
              <h2 id={titleId} className="font-display text-lg text-pearl mb-3">
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
