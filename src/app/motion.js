// src/app/motion.js
import { useEffect, useState } from "react";
import { getState, subscribe } from "./store.js";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Single source of truth for motion preference: OS setting OR the in-app
 * override toggle. Every Framer Motion variant in the app routes through this.
 */
export function useReducedMotion() {
  const [osReduced, setOsReduced] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(QUERY).matches;
  });
  const [override, setOverride] = useState(() => getState().settings.reducedMotionOverride);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    const onChange = (e) => setOsReduced(e.matches);
    // addEventListener is the modern API; addListener is the Safari <14 fallback
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  useEffect(() => subscribe(() => setOverride(getState().settings.reducedMotionOverride)), []);

  return osReduced || override;
}

export const EASE = [0.22, 0.61, 0.36, 1];
export const SPRING = { type: "spring", stiffness: 130, damping: 23, mass: 1 };

/** Gentle page transition (cross-fade + small y-rise). */
export function pageTransition(reduced) {
  if (reduced) {
    // True reduced motion: mount at the final state, no fade at all. (`initial:
    // false` tells Framer to skip the entry animation entirely.)
    return {
      initial: false,
      animate: { opacity: 1 },
      exit: { opacity: 1 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
    transition: { duration: 0.5, ease: EASE },
  };
}
