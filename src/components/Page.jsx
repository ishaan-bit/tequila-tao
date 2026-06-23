// src/components/Page.jsx — full-screen flow page wrapper + back header + gentle transition.
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useReducedMotion, pageTransition } from "../app/motion.js";
import { tap } from "../app/haptics.js";

export function BackHeader({ title, onBack, right }) {
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between gap-3 pt-safe px-safe py-3">
      <button
        onClick={() => {
          tap();
          onBack ? onBack() : navigate(-1);
        }}
        aria-label="Back"
        className="raised rounded-full h-touch w-touch grid place-items-center active:scale-95"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      {title && <h1 className="font-display text-lg text-pearl truncate">{title}</h1>}
      <div className="h-touch w-touch grid place-items-center">{right}</div>
    </header>
  );
}

export default function Page({ children, className = "", center = false }) {
  const reduced = useReducedMotion();
  const t = pageTransition(reduced);
  return (
    <motion.div
      initial={t.initial}
      animate={t.animate}
      exit={t.exit}
      transition={t.transition}
      className={`app-bg min-h-screen-safe ${center ? "grid place-items-center" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}
