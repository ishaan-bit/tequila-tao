// src/app/craving.js
// The guided craving intervention, modelled as pure data so the flow is testable
// and the screen stays presentation-only. The intervention has a fixed spine —
// arrive → breathe → ride → (act) → reflect — and ADAPTS its length to the
// reported intensity, so a mild urge gets a short path and a strong one gets more
// grounding, a longer delay, and a concrete replacement action.

export const STEP = {
  arrive: "arrive", // acknowledge: you don't have to solve the whole night
  breathe: "breathe", // grounding + paced breathing + the delay timer
  ride: "ride", // urge surfing / body awareness
  act: "act", // a concrete distraction / replacement action
  reflect: "reflect", // re-rate, log the win, or the compassionate "I drank"
};

/**
 * The delay/breathe horizon, in seconds, scaled to intensity. Never a medical
 * claim about this person — just the well-replicated "most cravings crest and
 * fade within ~20 minutes; a few focused minutes now changes the next decision".
 */
export function breatheSeconds(intensity = 5) {
  if (intensity >= 8) return 180;
  if (intensity >= 4) return 120;
  return 75;
}

/** A short, honest horizon label for the intensity (no medical promise). */
export function horizonLabel(intensity = 5) {
  if (intensity >= 8) return "Strong ones crest and ease, usually within ~20 minutes.";
  if (intensity >= 4) return "Most cravings peak and pass within ~20 minutes.";
  return "This is a small wave. It's already on its way out.";
}

/**
 * The ordered step keys for a craving of the given intensity. The spine is
 * always present; `ride` and `act` switch on as intensity climbs, so the flow
 * feels proportional to the moment instead of a fixed wizard.
 *   intensity < 4  → arrive · breathe · reflect
 *   4–7            → arrive · breathe · ride · reflect
 *   ≥ 8            → arrive · breathe · ride · act · reflect
 */
export function buildCravingSteps(intensity = 5) {
  const steps = [STEP.arrive, STEP.breathe];
  if (intensity >= 4) steps.push(STEP.ride);
  if (intensity >= 8) steps.push(STEP.act);
  steps.push(STEP.reflect);
  return steps;
}

/**
 * What happens when the flow ends. Kept pure so the routing + the "don't write a
 * phantom failed craving" rule are both testable:
 *   - made_it → log the won craving (the most-rewarded event) and go home
 *   - drank   → hand off to the drink log (compassionate); the craving is logged
 *               there as "drank" so abandoning the drink screen leaves nothing
 *               half-written.
 */
export function resolveCravingOutcome(outcome, { before, after } = {}) {
  if (outcome === "drank") {
    return { route: "/sendoff", routeState: { before, after, fromUrge: true }, event: null };
  }
  return {
    route: "/home",
    event: { type: "urge_surf", payload: { before, after, outcome: "made_it" } },
    routeState: { toast: "Logged — you rode it out." },
  };
}

// Replacement actions offered at the `act` step for a strong craving. Concrete,
// reachable, non-alcoholic — chosen to occupy hands + mouth + attention.
export const REPLACEMENTS = [
  { id: "water", icon: "💧", label: "Cold drink", sub: "Sip water or soda, slowly" },
  { id: "walk", icon: "🚶", label: "Move", sub: "Step outside or to another room" },
  { id: "call", icon: "💬", label: "Reach out", sub: "Message someone you trust" },
  { id: "snack", icon: "🍫", label: "Eat something", sub: "A small snack steadies you" },
  { id: "shower", icon: "🚿", label: "Cool water", sub: "Splash your face or a quick shower" },
  { id: "screen", icon: "🎧", label: "Distract", sub: "Music, a show, a game — 10 minutes" },
];
