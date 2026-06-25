// src/components/CravingStep.jsx
// The immersive frame every step of the craving intervention shares, so moving
// through it feels like moving through a moment — not a generic onboarding
// wizard. It guarantees three things on every step: you can always see how far
// you've come (the progress rail), you can always leave safely (exit), and the
// compassionate "I'm going to drink" escape hatch + urgent-help are always
// reachable but never dominate.
import { motion } from "framer-motion";
import { useReducedMotion } from "../app/motion.js";

export function CravingProgress({ total, current }) {
  return (
    <div className="flex items-center gap-1.5" role="presentation" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-500 ${
            i === current ? "w-6 bg-jade" : i < current ? "w-1.5 bg-jade/60" : "w-1.5 bg-white/20"
          }`}
        />
      ))}
    </div>
  );
}

export default function CravingStep({
  total,
  current,
  stepKey,
  onExit,
  onDrank,
  onUrgentHelp,
  children,
  footer,
  drankLink = true, // hidden on the reflect step, where the drink choice is primary
}) {
  const reduced = useReducedMotion();
  return (
    <div className="min-h-screen-safe flex flex-col">
      <div className="flex items-center justify-between pt-safe px-safe py-3">
        <button
          onClick={onExit}
          aria-label="Leave the exercise"
          className="raised rounded-full h-touch w-touch grid place-items-center active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <CravingProgress total={total} current={current} />
        <span className="text-[11px] text-pearl-faint w-touch text-right tnum" aria-live="polite">
          {current + 1}/{total}
        </span>
      </div>

      <motion.div
        key={stepKey}
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={reduced ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
        className="flex-1 flex flex-col justify-center px-safe py-4"
      >
        {children}
      </motion.div>

      <div className="px-safe pb-gutter space-y-3">
        {footer}
        <div className="flex items-center justify-center gap-3 text-xs text-pearl-faint">
          {drankLink && (
            <>
              <button onClick={onDrank} className="underline underline-offset-4 hover:text-pearl min-h-touch px-2">
                I'm going to drink
              </button>
              <span className="text-white/20" aria-hidden>
                ·
              </span>
            </>
          )}
          <button onClick={onUrgentHelp} className="underline underline-offset-4 hover:text-pearl min-h-touch px-2">
            Urgent help
          </button>
        </div>
      </div>
    </div>
  );
}
