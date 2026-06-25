// src/components/Feedback.jsx — calm, no-red feedback: a bottom toast and a
// single-ripple milestone bloom (never confetti).
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "../app/motion.js";
import { Button } from "./ui.jsx";

export function Toast({ show, children, tone = "jade" }) {
  const tones = {
    jade: "border-jade/40 text-jade",
    gold: "border-gold/40 text-gold",
    pearl: "border-white/20 text-pearl",
  };
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed above-nav left-1/2 -translate-x-1/2 z-[60] px-4 w-full max-w-sm"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.35 }}
          role="status"
          aria-live="polite"
        >
          <div className={`glass-strong rounded-2xl px-4 py-3 text-sm text-center border ${tones[tone]}`}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Bloom({ show, title, lines = [], cta = "Beautiful", onClose }) {
  const reduced = useReducedMotion();
  const ctaRef = useRef(null);
  const prevFocus = useRef(null);

  useEffect(() => {
    if (!show) return;
    prevFocus.current = document.activeElement;
    const t = setTimeout(() => ctaRef.current?.focus(), 60);
    return () => {
      clearTimeout(t);
      if (prevFocus.current && prevFocus.current.focus) prevFocus.current.focus();
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: "rgba(11,14,26,0.78)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose?.();
          }}
        >
          {!reduced && (
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ width: 280, height: 280, border: "1px solid rgba(216,178,74,0.6)" }}
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            />
          )}
          <motion.div
            ref={ctaRef}
            tabIndex={-1}
            className="glass-strong rounded-3xl p-6 text-center max-w-sm w-full focus:outline-none"
            initial={{ scale: 0.9, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="text-gold text-sm uppercase tracking-[0.2em] mb-2">Milestone</div>
            <h2 className="font-display text-2xl text-pearl mb-3">{title}</h2>
            <div className="space-y-1 text-pearl-soft text-sm mb-5">
              {lines.map((l, i) => (
                <p key={i}>{l}</p>
              ))}
            </div>
            <Button variant="primary" full onClick={onClose}>
              {cta}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
