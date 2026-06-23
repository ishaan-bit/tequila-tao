// src/components/AdaptiveTheme.jsx
// State-adaptive ambience. Renders nothing — it just live-sets the CSS variables
// that drive the immersive background (body::before in index.css), so the whole
// app subtly shifts with the time of day and the user's active goal:
//   • time of day → the base tone + a top "sky" glow + the warmth at the foot
//   • goal        → the accent glow (cutback jade · break teal · quit gold)
// Calm by design: it nudges hue/warmth, never flashes. Honours reduced motion via
// the global CSS (the drift animation is frozen there).
import { useEffect } from "react";
import { useProfile } from "../app/hooks.js";

const TIME = {
  morning: { base: "#0e1424", g1: "rgba(239, 154, 107, 0.16)", g3: "rgba(94, 201, 138, 0.12)" }, // dawn warmth
  day: { base: "#0b1120", g1: "rgba(127, 179, 255, 0.16)", g3: "rgba(57, 182, 196, 0.12)" }, // bright
  evening: { base: "#090c17", g1: "rgba(94, 201, 138, 0.14)", g3: "rgba(122, 15, 43, 0.30)" }, // dusk
  night: { base: "#070912", g1: "rgba(90, 120, 210, 0.12)", g3: "rgba(20, 26, 52, 0.55)" }, // deep night
};

const GOAL_GLOW = {
  cutback: "rgba(94, 201, 138, 0.16)", // jade
  break: "rgba(57, 182, 196, 0.18)", // teal — a cool reset
  quit: "rgba(216, 178, 74, 0.16)", // gold — resolve / milestone warmth
};

function partOfDay(h) {
  if (h < 5) return "night";
  if (h < 11) return "morning";
  if (h < 17) return "day";
  if (h < 21) return "evening";
  return "night";
}

export default function AdaptiveTheme() {
  const profile = useProfile();
  const goal = profile?.intent || "cutback";

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const t = partOfDay(new Date().getHours());
      const tt = TIME[t] || TIME.evening;
      root.dataset.time = t;
      root.dataset.goal = goal;
      root.style.setProperty("--bg-base", tt.base);
      root.style.setProperty("--glow-1", tt.g1);
      root.style.setProperty("--glow-2", GOAL_GLOW[goal] || GOAL_GLOW.cutback);
      root.style.setProperty("--glow-3", tt.g3);
    };
    apply();
    // Re-evaluate on a slow tick so the mood tracks the clock if the app stays open.
    const id = setInterval(apply, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [goal]);

  return null;
}
