// src/app/haptics.js
// Guarded vibration. iOS Safari has no Vibration API — every call is a safe
// no-op there. Respects the in-app haptics setting.
import { getState } from "./store.js";

const PATTERNS = {
  light: 8,
  medium: 16,
  success: [10, 40, 12],
  milestone: [12, 60, 12, 60, 18],
};

function enabled() {
  try {
    return getState().settings.haptics !== false;
  } catch {
    return true;
  }
}

export function haptic(type = "light") {
  if (!enabled()) return;
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[type] || PATTERNS.light);
  } catch {
    /* ignore */
  }
}

export const tap = () => haptic("light");
export const success = () => haptic("success");
export const milestone = () => haptic("milestone");
