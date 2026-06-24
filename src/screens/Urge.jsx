// src/screens/Urge.jsx — Ride out a craving in real time. The most-rewarded
// action in the app. Always reachable, fully offline. A breathing pacer
// (in 4 · hold 2 · out 6 · short rest) doubles as the disc's breath; the longer
// exhale is the calming part and the holds stay brief. Reduced-motion gets a
// calm text cue instead of any scaling.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { addEvent } from "../app/store.js";
import { useStats } from "../app/hooks.js";
import { useReducedMotion } from "../app/motion.js";
import { success } from "../app/haptics.js";
import Page, { BackHeader } from "../components/Page.jsx";
import YinYang from "../components/YinYang.jsx";
import { Button, Slider } from "../components/ui.jsx";

const GROUNDING = [
  "This craving will pass. You don't have to act on it.",
  "Name 3 things you can hear right now.",
  "Cravings usually fade within about 20 minutes.",
  "Feel your feet. The floor is holding you.",
  "You don't have to fight it — just let it be there and breathe.",
  "Soften your jaw. Drop your shoulders.",
];
// Gentle, short-hold pacing. The long exhale is what calms the nervous system;
// the holds stay brief on purpose. Per-phase durations (ms) instead of a fixed
// interval, so "Hold"/"Rest" can be much shorter than the breaths.
const BREATH = [
  { label: "Breathe in", dur: 4000, scale: 1.16 },
  { label: "Hold", dur: 2000, scale: 1.16 },
  { label: "Breathe out", dur: 6000, scale: 0.9 },
  { label: "Rest", dur: 1000, scale: 0.9 },
];
const FULL = 180; // seconds total

export default function Urge() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const s = useStats();
  const [phase, setPhase] = useState("pre"); // pre | breathe | post
  const [before, setBefore] = useState(6);
  const [after, setAfter] = useState(3);
  const [done, setDone] = useState(false);

  // breathe timers
  const [remaining, setRemaining] = useState(FULL);
  const [breathIdx, setBreathIdx] = useState(0);
  const [groundIdx, setGroundIdx] = useState(0);
  const tickRef = useRef(null);
  const breathRef = useRef(null);
  const groundRef = useRef(null);

  // countdown + rotating grounding cue (updater stays pure — the phase change
  // is handled by the watcher effect below)
  useEffect(() => {
    if (phase !== "breathe") return;
    tickRef.current = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    groundRef.current = setInterval(() => setGroundIdx((i) => (i + 1) % GROUNDING.length), 8000);
    return () => {
      clearInterval(tickRef.current);
      clearInterval(groundRef.current);
    };
  }, [phase]);

  // when the timer empties, move to the post step
  useEffect(() => {
    if (phase === "breathe" && remaining === 0) setPhase("post");
  }, [phase, remaining]);

  // breath pacer: advance each phase after ITS own duration (variable length, so
  // the holds can be short). Re-subscribing on breathIdx reads the fresh phase.
  useEffect(() => {
    if (phase !== "breathe") return;
    breathRef.current = setTimeout(
      () => setBreathIdx((i) => (i + 1) % BREATH.length),
      BREATH[breathIdx].dur
    );
    return () => clearTimeout(breathRef.current);
  }, [phase, breathIdx]);

  const skipTo90 = () => setRemaining((r) => Math.min(r, 90));

  const finish = (outcome) => {
    if (done) return;
    if (outcome === "drank") {
      // Defer the urge_surf write to Sendoff so backing out of it doesn't leave a
      // phantom "failed" craving skewing the proof stats. No replace: → Back
      // returns here to the post-step.
      navigate("/sendoff", { state: { before, after, fromUrge: true } });
      return;
    }
    setDone(true);
    const ev = addEvent("urge_surf", { before, after, outcome: "made_it" });
    success();
    navigate("/home", { replace: true, state: { justLogged: { id: ev.id, label: "Logged — you rode it out." } } });
  };

  const mmss = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;

  return (
    <Page>
      <div className="max-w-md mx-auto min-h-screen-safe flex flex-col">
        <BackHeader title="Ride out the craving" onBack={() => navigate("/home")} />

        {phase === "pre" && (
          <div className="flex-1 flex flex-col justify-center px-safe pb-16 space-y-6">
            <div className="text-center">
              <YinYang yinPct={50} size={150} breath className="mx-auto mb-5" />
              <h2 className="font-display text-2xl text-pearl">Let's get through this</h2>
              <p className="text-pearl-soft text-sm mt-1">Cravings usually fade within about 20 minutes. We'll breathe through it together.</p>
            </div>
            <div className="glass rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-pearl-soft">How strong is the craving?</span>
                <span className="tnum text-lg text-pearl">{before}/10</span>
              </div>
              <Slider id="before" ariaLabel="Craving strength, 1 to 10" value={before} min={1} max={10} onChange={setBefore} />
            </div>
            <Button variant="primary" size="lg" full onClick={() => setPhase("breathe")}>
              Begin
            </Button>
            <button
              onClick={() => navigate("/terms")}
              className="block mx-auto text-xs text-pearl-faint underline underline-offset-4 hover:text-pearl min-h-touch"
            >
              In crisis or unsafe? Get urgent help →
            </button>
          </div>
        )}

        {phase === "breathe" && (
          <div className="flex-1 flex flex-col items-center justify-center px-safe pb-16 text-center">
            {reduced ? (
              <div className="grid place-items-center">
                <YinYang yinPct={55} size={180} />
              </div>
            ) : (
              <motion.div
                animate={{ scale: BREATH[breathIdx].scale }}
                transition={{ duration: BREATH[breathIdx].dur / 1000, ease: breathIdx % 2 === 0 ? "easeInOut" : "linear" }}
              >
                <YinYang yinPct={55} size={200} />
              </motion.div>
            )}
            <div className="mt-6 text-2xl font-display text-pearl">{BREATH[breathIdx].label}</div>
            <p className="mt-3 text-pearl-soft text-sm max-w-xs min-h-[2.5rem]">{GROUNDING[groundIdx]}</p>

            <div className="mt-6 w-full max-w-xs">
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-teal transition-[width] duration-1000 ease-linear" style={{ width: `${(1 - remaining / FULL) * 100}%` }} />
              </div>
              <div className="mt-2 tnum text-pearl-faint text-sm">{mmss} · cravings usually fade in ~20 min</div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="ghost" onClick={skipTo90}>
                Shorten timer
              </Button>
              <Button variant="glass" onClick={() => setPhase("post")}>
                I feel ready →
              </Button>
            </div>
          </div>
        )}

        {phase === "post" && (
          <div className="flex-1 flex flex-col justify-center px-safe pb-16 space-y-6">
            <div className="text-center">
              <h2 className="font-display text-2xl text-pearl">How strong is it now?</h2>
              <p className="text-pearl-soft text-sm mt-1">Notice if the craving eased. Getting through it is what builds the habit.</p>
            </div>
            <div className="glass rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-pearl-soft">Craving now</span>
                <span className="tnum text-lg text-pearl">{after}/10</span>
              </div>
              <Slider id="after" ariaLabel="Craving strength now, 1 to 10" value={after} min={1} max={10} onChange={setAfter} />
              {after < before && (
                <div className="mt-2 text-jade text-sm">
                  Down from {before} to {after}. It eased — and you didn't drink.
                </div>
              )}
            </div>
            {/* Self-efficacy proof at the MOMENT of success — enactive mastery is
                the strongest lever (Bandura), so surface it here, not just on Progress. */}
            <div className="glass rounded-2xl p-3 text-center text-sm text-pearl-soft">
              Riding this out makes craving <span className="text-jade font-semibold">#{s.urgesSurfed + 1}</span> you've gotten through
              {after < before ? <> — and it dropped <span className="text-jade font-semibold tnum">{before - after}</span> {before - after === 1 ? "point" : "points"} just now.</> : "."}
            </div>
            <div className="space-y-3">
              <Button variant="primary" size="lg" full disabled={done} onClick={() => finish("made_it")}>
                I made it — I didn't drink
              </Button>
              <Button variant="ghost" full disabled={done} onClick={() => finish("drank")}>
                I'm choosing to drink (that's okay)
              </Button>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
