// src/components/Mascot.jsx — Tao, the dry-but-warm yin-yang spirit.
import { useMemo } from "react";
import YinYang from "./YinYang.jsx";

const QUIPS = {
  home: [
    "Nice to see you. Small steps add up.",
    "I counted your alcohol-free nights. Lost count. Good problem.",
    "Showing up is the whole trick — and you're here.",
    "One night at a time. That's all this is.",
  ],
  night: [
    "No lecture. Drink water, sleep well, see you tomorrow.",
    "Have a good one. I'll be here in the morning, no judgment.",
    "Get home safe. Tomorrow's a soft place.",
  ],
  morning: ["A rough morning is data, not failure.", "Slow sips. The fog lifts."],
  comeback: ["Welcome back.", "Your best days still happened. Keep going."],
  urge: ["This craving will pass. You don't have to act on it.", "Cravings usually fade in about twenty minutes."],
};

export function quipFor(context = "home", seed = 0) {
  const list = QUIPS[context] || QUIPS.home;
  return list[Math.abs(seed) % list.length];
}

export default function Mascot({ context = "home", quip, className = "" }) {
  // stable-per-mount quip (Date/Math.random kept out of render purity concerns)
  const text = useMemo(() => quip || quipFor(context, Math.floor(performance.now() / 1000)), [context, quip]);
  return (
    <div className={`flex items-center gap-2.5 text-pearl-soft ${className}`}>
      <YinYang yinPct={62} size={26} showSeeds showTarget={false} />
      <span className="text-[13px] italic leading-snug">{text}</span>
    </div>
  );
}
