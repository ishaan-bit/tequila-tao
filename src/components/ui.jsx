// src/components/ui.jsx — shared, accessible UI primitives.
import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { tap as hapticTap } from "../app/haptics.js";
import { useReducedMotion } from "../app/motion.js";

export function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

/* ---------------- Button ----------------
   variant (one hue per meaning, so a button reads as what it DOES):
     primary → jade   · a win / progress (log a clear night, "I made it")
     calm    → teal   · grounding, steadying (the craving-rescue action)
     care    → sage   · gentle, non-celebratory care (check-in, morning-after)
     warm    → amber  · celebration / milestone
     wine    → wine   · destructive (clear data)
     glass   → raised · neutral secondary
     ghost   → outline · quiet tertiary
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
    calm: "btn-calm font-semibold hover:brightness-105 active:brightness-95",
    care: "btn-care font-semibold hover:brightness-[1.07] active:brightness-95",
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

/* ---------------- Card ----------------
   strong → the brighter, more elevated surface (for hero/primary cards).
   accent → a hairline of brand colour along the top edge for emphasis. */
export function Card({ children, className = "", as: Tag = "div", strong = false, accent, ...rest }) {
  return (
    <Tag className={cn(strong ? "glass-strong" : "glass", "rounded-3xl p-5 relative overflow-hidden", className)} {...rest}>
      {accent && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${TONES[accent]?.hex || accent} 28%, ${TONES[accent]?.hex || accent} 72%, transparent)`, opacity: 0.7 }}
        />
      )}
      {children}
    </Tag>
  );
}

/* ---------------- Tones ----------------
   One source of truth for accent colours, used by IconBadge / Card accents /
   ListRow. Mirrors the @theme palette (one hue per meaning). */
export const TONES = {
  jade: { hex: "#5ec98a" },
  amber: { hex: "#e0962f" },
  ember: { hex: "#ef9a6b" },
  moonstone: { hex: "#9ec7e8" },
  focus: { hex: "#7fb3ff" },
  gold: { hex: "#d8b24a" },
  teal: { hex: "#39b6c4" },
  sage: { hex: "#93b6c6" },
  slate: { hex: "#8a99ad" },
  wine: { hex: "#e0738a" },
  danger: { hex: "#ff6b5e" },
  pearl: { hex: "#cdd4e4" },
};

/* ---------------- IconBadge ----------------
   A tinted, lit rounded container for a leading glyph. `tone` sets the hue. */
export function IconBadge({ tone = "pearl", children, size, className = "" }) {
  const hex = TONES[tone]?.hex || tone;
  return (
    <span className={cn("icon-badge", className)} style={{ "--badge": hex, ...(size ? { height: size, width: size } : null) }} aria-hidden>
      {children}
    </span>
  );
}

/* ---------------- ListRow ----------------
   The modern replacement for "Label →" text links: a tappable shelf with a
   leading icon-badge, a title (+ optional sub) and a trailing chevron (or any
   custom trailing node). Renders as a button by default. */
export function ListRow({ icon, tone = "pearl", title, sub, onClick, trailing, danger = false, className = "", haptic = true, ...rest }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        if (haptic) hapticTap();
        onClick?.(e);
      }}
      data-tone={danger ? "danger" : undefined}
      className={cn("list-row min-h-touch", className)}
      {...rest}
    >
      {icon != null && (
        <IconBadge tone={danger ? "danger" : tone}>{icon}</IconBadge>
      )}
      <span className="flex-1 min-w-0">
        <span className={cn("block font-medium truncate", danger ? "text-danger" : "text-pearl")}>{title}</span>
        {sub && <span className="block text-xs text-pearl-faint truncate">{sub}</span>}
      </span>
      {trailing !== undefined ? (
        trailing
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-pearl-faint shrink-0">
          <path d="M9 6l6 6-6 6" />
        </svg>
      )}
    </button>
  );
}

/* ---------------- Section ----------------
   A titled card group with an optional leading icon-badge in the header. The
   shared shell for Settings (and anywhere a labelled group of controls lives). */
export function Section({ title, icon, tone = "pearl", children, className = "", contentClassName = "space-y-3" }) {
  return (
    <section className={cn("glass rounded-3xl p-5", className)}>
      <div className="flex items-center gap-3 mb-4">
        {icon != null && <IconBadge tone={tone}>{icon}</IconBadge>}
        <h2 className="font-display text-lg text-pearl">{title}</h2>
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

/* ---------------- Segmented control ----------------
   A connected pill track of mutually-exclusive options (e.g. the goal switcher).
   The selected segment slides with a shared layoutId for a smooth, modern feel. */
export function Segmented({ options, value, onChange, ariaLabel, className = "" }) {
  const reduced = useReducedMotion();
  const cols = options.length;
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("segmented", className)}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-pressed={selected}
            onClick={() => {
              if (selected) return;
              hapticTap();
              onChange?.(o.value);
            }}
            className="relative grid place-items-center px-2 text-sm"
          >
            {selected && (
              <motion.span
                layoutId={ariaLabel ? `seg-${ariaLabel}` : undefined}
                className="absolute inset-0 seg-active rounded-[0.85rem]"
                transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                aria-hidden
              />
            )}
            <span className={cn("relative z-10", selected && "text-pearl")}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- SwitchTrack ----------------
   The shared on/off switch VISUAL (presentational only — wrap it in a
   role="switch" button that owns the click + aria-checked). Used by BOTH the
   Settings rows and the first-run consent screen so the toggle looks identical
   everywhere. The two states are made deliberately unmistakable: OFF = a dark,
   recessed groove with the light knob parked LEFT; ON = a bright jade fill with
   a dark knob slid RIGHT. Colour, knob-colour AND position all flip together,
   so "is it on or off?" is never a guess (the old faint white-on-glass pill
   was the thing that read as ambiguous). */
export function SwitchTrack({ checked, className = "" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block shrink-0 w-[3.25rem] h-8 rounded-full p-1 border transition-colors duration-200",
        checked
          ? "bg-jade border-jade shadow-[0_4px_14px_-3px_rgba(94,201,138,0.7)]"
          : "bg-ink/80 border-white/25 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]",
        className
      )}
    >
      <span
        className={cn(
          "block h-6 w-6 rounded-full transition-transform duration-200",
          checked ? "translate-x-5 bg-ink" : "translate-x-0 bg-pearl"
        )}
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
      />
    </span>
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
      <span className="text-[11px] uppercase tracking-wider text-pearl-soft">{label}</span>
      <span className={cn("text-xl font-semibold tnum leading-tight", accents[accent])}>{children}</span>
      {hint && <span className="text-[11px] text-pearl-faint">{hint}</span>}
    </Comp>
  );
}

/* ---------------- Sparkline (mood 1–5, null = gap) ----------------
   A real trend: jade line with a soft area fill under it, a faint dashed mid
   baseline, and a glowing dot on the latest point. Fills the full card width. */
export function Sparkline({ data = [], height = 68, stroke = "var(--color-jade)", ariaLabel }) {
  const width = 300; // viewBox units; the SVG scales to 100% width via preserveAspectRatio
  const pts = data.filter((d) => d.mood != null);
  if (pts.length < 2) {
    return (
      <div style={{ width: "100%", minHeight: height }} className="relative grid place-items-center">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="absolute inset-0" aria-hidden>
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(244,241,232,0.14)" strokeWidth="1.5" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="relative text-xs text-pearl-soft text-center px-4">Tap a face each day — your trend grows here.</span>
      </div>
    );
  }
  const n = data.length;
  const xStep = width / Math.max(1, n - 1);
  const pad = 8;
  const norm = (m) => height - pad - ((m - 1) / 4) * (height - pad * 2);
  let line = "";
  const coords = [];
  data.forEach((pt, i) => {
    if (pt.mood == null) return;
    const x = i * xStep;
    const y = norm(pt.mood);
    coords.push([x, y]);
    line += (line === "" ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
  });
  const first = coords[0];
  const last = coords[coords.length - 1];
  const area = `${line} L ${last[0].toFixed(1)} ${height} L ${first[0].toFixed(1)} ${height} Z`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      style={{ display: "block" }}
      role="img"
      aria-label={ariaLabel || "Clarity trend"}
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-jade)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--color-jade)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(244,241,232,0.1)" strokeWidth="1" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
      <path d={area} fill="url(#spark-fill)" stroke="none" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {/* latest point — drawn in absolute units so it stays a circle under non-uniform scale is impossible; use a small group with vector-effect */}
      <circle cx={last[0]} cy={last[1]} r="3.2" fill="var(--color-jade)" stroke="var(--color-ink)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
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
    <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={label}>
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
              "w-full min-h-touch rounded-2xl py-2 flex flex-col items-center justify-center gap-1 transition-[background-color,box-shadow,transform] duration-200",
              selected ? cn("is-selected ring-2 ring-jade", !reduced && "scale-[1.05]") : "raised"
            )}
          >
            <span aria-hidden className="text-[1.65rem] leading-none">{m.face}</span>
            <span className={cn("text-[9px] font-medium leading-none tracking-wide", selected ? "text-ink/80" : "text-pearl-faint")}>{m.label}</span>
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
        className="raised h-touch w-touch rounded-2xl grid place-items-center active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden><path d="M5 12h14" /></svg>
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
        className="raised h-touch w-touch rounded-2xl grid place-items-center active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
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
