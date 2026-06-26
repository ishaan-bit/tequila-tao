// src/components/DailyStateCard.jsx
// THE one dominant action on Home. It renders whichever single state the pure
// `primaryAction` resolver chose, so Home never makes the user pick between
// several equally-loud cards. Everything else on Home is deliberately quieter
// than this.
import { motion } from "framer-motion";
import { useReducedMotion } from "../app/motion.js";
import { StatusMark } from "./status.jsx";
import { MoodPicker, Card } from "./ui.jsx";

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

const STATUS_ACCENT = { clear: "jade", frozen: "moonstone", drank: "slate", rest: "sage" };

export default function DailyStateCard({ action, isAbstinence = false, abstinenceSub, onNavigate, onMood }) {
  const reduced = useReducedMotion();

  if (action.kind === "checkin") {
    return (
      <Card strong accent="jade" aria-label="Daily check-in">
        <h2 className="text-pearl font-display text-xl">How are you, really?</h2>
        <p className="text-sm text-pearl-soft mb-4 mt-1">One honest tap. Showing up is the whole habit.</p>
        <MoodPicker value={null} onChange={onMood} />
      </Card>
    );
  }

  if (action.kind === "logged") {
    const c = LoggedCopy(action.status, isAbstinence);
    const accentHex = action.status === "clear" ? "#5ec98a" : action.status === "frozen" ? "#9ec7e8" : "#93b6c6";
    return (
      <section className="glass-strong rounded-3xl p-5 w-full relative" aria-label="Tonight is logged">
        <span aria-hidden className="absolute inset-x-0 top-0 h-px rounded-t-3xl" style={{ background: `linear-gradient(90deg, transparent, ${accentHex} 30%, ${accentHex} 70%, transparent)`, opacity: 0.7 }} />
        <div className="flex items-start gap-3.5">
          <StatusMark status={action.status} size={44} />
          <div className="flex-1 min-w-0">
            <div className="font-display text-lg text-pearl leading-snug">{c.title}</div>
            <div className="text-sm text-pearl-soft mt-0.5">{c.sub}</div>
          </div>
          <button
            onClick={() => onNavigate("/crossroads")}
            className="raised rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-pearl shrink-0 active:scale-95 transition"
          >
            Change
          </button>
        </div>
      </section>
    );
  }

  // recover | tonight — one dominant, calm call to action
  const c = COPY[action.kind] || COPY.tonight;
  const sub = action.kind === "tonight" && abstinenceSub ? abstinenceSub : c.sub;
  const accent = action.kind === "recover" ? "ember" : "jade";
  return (
    <motion.button
      onClick={() => onNavigate(c.to)}
      whileTap={reduced ? undefined : { scale: 0.99 }}
      className="w-full text-left glass-strong rounded-3xl p-5 relative overflow-hidden"
      aria-label={c.title}
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent === "ember" ? "#ef9a6b" : "#5ec98a"} 30%, ${accent === "ember" ? "#ef9a6b" : "#5ec98a"} 70%, transparent)`, opacity: 0.7 }} />
      <div className="flex items-center gap-4">
        <span className="grid place-items-center h-12 w-12 rounded-2xl shrink-0 text-2xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.18)" }} aria-hidden>
          {c.emoji}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-display text-xl text-pearl leading-tight">{c.title}</span>
          <span className="block text-sm text-pearl-soft mt-0.5">{sub}</span>
        </span>
        <span className="text-jade shrink-0 grid place-items-center h-8 w-8 rounded-full" style={{ background: "rgba(94,201,138,0.14)" }} aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h13M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </motion.button>
  );
}
