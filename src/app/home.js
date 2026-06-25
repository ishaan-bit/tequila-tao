// src/app/home.js
// Pure helpers for the Home screen's orientation and its single time/state-aware
// primary action. Kept out of the component so the "what should I do right now?"
// decision is testable and never tangled with copy or layout. The component maps
// the returned `kind` to its own presentation.

/** Coarse part of day used for greeting + default action. */
export function partOfDay(hour) {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

/** Calm, adult greeting that reads naturally around the whole clock. */
export function greeting(hour) {
  if (hour < 5) return "You're up late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Winding down";
}

/** "Wednesday, 25 June" (order follows the device locale). */
export function formatLongDate(now = Date.now()) {
  return new Date(now).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Resolve the ONE dominant action for Home, given the derived stats and the
 * current hour. Exactly one card is loud; everything else on Home is secondary.
 * Returns a small descriptor — the component owns the wording:
 *
 *   { kind: "recover" }                       morning after a drinking night, not yet cared for
 *   { kind: "logged", status }                tonight's decision is in — a quiet confirmation
 *   { kind: "checkin" }                        daytime, no mood logged yet — a one-tap check-in
 *   { kind: "tonight" }                        the default — make/lo­g tonight's decision
 */
export function primaryAction(s, hour) {
  const p = partOfDay(hour);
  const morning = p === "morning";
  const yesterday = s.last7?.[s.last7.length - 2];
  const drankRecently = !!s.drankToday || yesterday?.status === "drank";

  // A drinking night deserves a kind morning, but only until they've tended to
  // it — once a soft-landing is logged today we don't keep nagging.
  if (morning && drankRecently && !s.softLandingToday) return { kind: "recover" };

  if (s.decidedToday) {
    const status = s.drankToday ? "drank" : s.frozenToday ? "frozen" : "clear";
    return { kind: "logged", status };
  }

  if ((morning || p === "afternoon") && s.moodToday == null) return { kind: "checkin" };

  return { kind: "tonight" };
}
