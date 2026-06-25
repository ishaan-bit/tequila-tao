// src/components/DailyStateCard.jsx
// THE one dominant action on Home. It renders whichever single state the pure
// `primaryAction` resolver chose, so Home never makes the user pick between
// several equally-loud cards. Everything else on Home is deliberately quieter
// than this.
import { motion } from "framer-motion";
import { useReducedMotion } from "../app/motion.js";
import { StatusMark } from "./status.jsx";
import { MoodPicker } from "./ui.jsx";

const COPY = {
  recover: { emoji: "🌅", title: "A gentler morning", sub: "A few small kindnesses to feel steadier.", to: "/recover" },
  tonight: { emoji: "🌙", title: "Tonight", sub: "Take a quiet minute to decide your night.", to: "/crossroads" },
};

function LoggedCopy(status, isAbstinence) {
  if (status === "clear")
    return { title: "Tonight is alcohol-free", sub: "Quietly done — counted and kept." };
  if (status === "frozen")
    return { title: "Tonight's logged — protected", sub: "A planned night. Your streak stayed safe." };
  return {
    title: "Tonight's logged",
    sub: isAbstinence
      ? "Honestly done. Your best run and every total still stand — begin again tomorrow."
      : "Honestly done. Your history is safe — see you tomorrow.",
  };
}

export default function DailyStateCard({ action, isAbstinence = false, abstinenceSub, onNavigate, onMood }) {
  const reduced = useReducedMotion();

  if (action.kind === "checkin") {
    return (
      <section className="glass-strong rounded-3xl p-5" aria-label="Daily check-in">
        <h2 className="text-pearl font-display text-xl">How are you, really?</h2>
        <p className="text-sm text-pearl-soft mb-3 mt-0.5">One honest tap. Showing up is the whole habit.</p>
        <MoodPicker value={null} onChange={onMood} />
      </section>
    );
  }

  if (action.kind === "logged") {
    const c = LoggedCopy(action.status, isAbstinence);
    return (
      <section className="glass-strong rounded-3xl p-5 flex items-center gap-4" aria-label="Tonight is logged">
        <StatusMark status={action.status} size={46} />
        <div className="flex-1">
          <div className="font-display text-lg text-pearl">{c.title}</div>
          <div className="text-sm text-pearl-soft">{c.sub}</div>
        </div>
        <button
          onClick={() => onNavigate("/crossroads")}
          className="raised rounded-xl px-3 py-2 text-sm text-pearl shrink-0 active:scale-95 transition"
        >
          Change
        </button>
      </section>
    );
  }

  // recover | tonight — one dominant, calm call to action
  const c = COPY[action.kind] || COPY.tonight;
  const sub = action.kind === "tonight" && abstinenceSub ? abstinenceSub : c.sub;
  return (
    <motion.button
      onClick={() => onNavigate(c.to)}
      whileTap={reduced ? undefined : { scale: 0.99 }}
      className="w-full text-left glass-strong rounded-3xl p-5"
      aria-label={c.title}
    >
      <div className="flex items-center gap-4">
        <span className="text-3xl" aria-hidden>
          {c.emoji}
        </span>
        <span className="flex-1">
          <span className="block font-display text-xl text-pearl">{c.title}</span>
          <span className="block text-sm text-pearl-soft">{sub}</span>
        </span>
        <span className="text-jade text-2xl" aria-hidden>
          →
        </span>
      </div>
    </motion.button>
  );
}
