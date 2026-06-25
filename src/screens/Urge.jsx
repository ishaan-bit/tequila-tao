// src/screens/Urge.jsx — the craving intervention. Not a form: a short guided
// passage through a hard moment. It opens by acknowledging the craving, takes a
// fast/tactile intensity reading, then walks an ADAPTIVE sequence (the pure
// model in app/craving.js decides the steps) — paced breathing + a delay timer,
// urge-surfing, a concrete replacement action for strong urges — and ends by
// re-rating and logging the win. A compassionate "I'm going to drink" exit and
// urgent-help are reachable from every step. The most-rewarded action in the app.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { addEvent } from "../app/store.js";
import { useStats } from "../app/hooks.js";
import { useReducedMotion } from "../app/motion.js";
import { success } from "../app/haptics.js";
import {
  buildCravingSteps,
  breatheSeconds,
  horizonLabel,
  resolveCravingOutcome,
  REPLACEMENTS,
  STEP,
} from "../app/craving.js";
import Page from "../components/Page.jsx";
import CravingStep from "../components/CravingStep.jsx";
import YinYang from "../components/YinYang.jsx";
import { Button, Slider } from "../components/ui.jsx";

const GROUNDING = [
  "Name three things you can hear right now.",
  "Feel your feet. The floor is holding you.",
  "Soften your jaw. Drop your shoulders.",
  "You don't have to fight it — just let it be there and breathe.",
  "This wave is already on its way down.",
];
// In 4 · hold 2 · out 6 · short rest — the long exhale is the calming part.
const BREATH = [
  { label: "Breathe in", dur: 4000, scale: 1.16 },
  { label: "Hold", dur: 2000, scale: 1.16 },
  { label: "Breathe out", dur: 6000, scale: 0.9 },
  { label: "Rest", dur: 1000, scale: 0.9 },
];

export default function Urge() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const s = useStats();

  const [before, setBefore] = useState(6);
  const [after, setAfter] = useState(3);
  const [replacement, setReplacement] = useState(null);
  const [done, setDone] = useState(false);

  // The adaptive sequence, and where we are in it.
  const steps = useMemo(() => buildCravingSteps(before), [before]);
  const [idx, setIdx] = useState(0);
  const step = steps[idx];
  const advance = () => setIdx((i) => Math.min(steps.length - 1, i + 1));

  // ---- breathing step timers ----
  const fullSecs = useMemo(() => breatheSeconds(before), [before]);
  const [remaining, setRemaining] = useState(fullSecs);
  const [breathIdx, setBreathIdx] = useState(0);
  const [groundIdx, setGroundIdx] = useState(0);
  const tickRef = useRef(null);
  const breathRef = useRef(null);
  const groundRef = useRef(null);

  // Start the clock fresh whenever we ENTER the breathe step.
  useEffect(() => {
    if (step !== STEP.breathe) return;
    setRemaining(fullSecs);
    tickRef.current = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    groundRef.current = setInterval(() => setGroundIdx((i) => (i + 1) % GROUNDING.length), 8000);
    return () => {
      clearInterval(tickRef.current);
      clearInterval(groundRef.current);
    };
  }, [step, fullSecs]);

  // When the delay empties, ease forward automatically.
  useEffect(() => {
    if (step === STEP.breathe && remaining === 0) advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, remaining]);

  // Breath pacer with per-phase durations (so holds stay short).
  useEffect(() => {
    if (step !== STEP.breathe) return;
    breathRef.current = setTimeout(() => setBreathIdx((i) => (i + 1) % BREATH.length), BREATH[breathIdx].dur);
    return () => clearTimeout(breathRef.current);
  }, [step, breathIdx]);

  const finish = (outcome) => {
    if (done) return;
    const r = resolveCravingOutcome(outcome, { before, after });
    if (outcome === "drank") {
      navigate(r.route, { state: r.routeState });
      return;
    }
    setDone(true);
    const ev = addEvent(r.event.type, { ...r.event.payload, replacement });
    success();
    navigate(r.route, { replace: true, state: { justLogged: { id: ev.id, label: r.routeState?.toast } } });
  };

  const exit = () => navigate("/home");
  const urgent = () => navigate("/terms");
  const drank = () => finish("drank");
  const mmss = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;

  // ---------- per-step content ----------
  let content = null;
  let footer = null;
  let drankLink = true;

  if (step === STEP.arrive) {
    content = (
      <div className="text-center space-y-6">
        <YinYang yinPct={50} size={132} breath className="mx-auto" coolYang />
        <div>
          <h2 className="font-display text-2xl text-pearl">You're having a craving</h2>
          <p className="text-pearl-soft text-sm mt-2 max-w-xs mx-auto">
            You don't have to solve the whole night right now. Just stay with me for a few minutes.
          </p>
        </div>
        <div className="glass rounded-3xl p-5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-sm text-pearl-soft">How strong is it?</span>
            <span className="tnum text-2xl font-semibold text-pearl">{before}</span>
          </div>
          <Slider id="before" ariaLabel="Craving strength, 1 to 10" value={before} min={1} max={10} onChange={setBefore} />
          <p className="text-xs text-pearl-faint mt-2">{horizonLabel(before)}</p>
        </div>
      </div>
    );
    footer = (
      <Button variant="primary" size="lg" full onClick={advance}>
        Begin
      </Button>
    );
  } else if (step === STEP.breathe) {
    content = (
      <div className="flex flex-col items-center text-center">
        {reduced ? (
          <YinYang yinPct={55} size={172} coolYang />
        ) : (
          <motion.div animate={{ scale: BREATH[breathIdx].scale }} transition={{ duration: BREATH[breathIdx].dur / 1000, ease: breathIdx % 2 === 0 ? "easeInOut" : "linear" }}>
            <YinYang yinPct={55} size={190} coolYang />
          </motion.div>
        )}
        <div className="mt-6 text-2xl font-display text-pearl">{BREATH[breathIdx].label}</div>
        <p className="mt-3 text-pearl-soft text-sm max-w-xs min-h-[2.5rem]">{GROUNDING[groundIdx]}</p>
        <div className="mt-6 w-full max-w-xs">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-teal transition-[width] duration-1000 ease-linear" style={{ width: `${(1 - remaining / fullSecs) * 100}%` }} />
          </div>
          <div className="mt-2 tnum text-pearl-faint text-sm">{mmss} left · most cravings fade within ~20 min</div>
        </div>
        <button onClick={() => setRemaining((r) => Math.min(r, 30))} className="mt-4 text-xs text-pearl-faint underline underline-offset-4 hover:text-pearl min-h-touch">
          Shorten the timer
        </button>
      </div>
    );
    footer = (
      <Button variant="glass" full onClick={advance}>
        I feel steadier →
      </Button>
    );
  } else if (step === STEP.ride) {
    content = (
      <div className="text-center space-y-6">
        <motion.div
          aria-hidden
          className="mx-auto h-40 w-40 rounded-full grid place-items-center"
          style={{ background: "radial-gradient(circle, rgba(57,182,196,0.28), transparent 70%)" }}
          animate={reduced ? {} : { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={reduced ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-5xl">🌊</span>
        </motion.div>
        <div>
          <h2 className="font-display text-2xl text-pearl">Ride the wave</h2>
          <p className="text-pearl-soft text-sm mt-2 max-w-xs mx-auto">
            Where do you feel it in your body? Don't push it away — watch it like a wave. It rises, it crests, and it always falls. You're still here.
          </p>
        </div>
      </div>
    );
    footer = (
      <Button variant="glass" full onClick={advance}>
        It's passing →
      </Button>
    );
  } else if (step === STEP.act) {
    content = (
      <div className="space-y-5">
        <div className="text-center">
          <h2 className="font-display text-2xl text-pearl">Give the urge somewhere to go</h2>
          <p className="text-pearl-soft text-sm mt-2 max-w-xs mx-auto">Pick one small thing to do in the next ten minutes. Hands, mouth, or feet — busy beats willpower.</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {REPLACEMENTS.map((r) => {
            const sel = replacement === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setReplacement(sel ? null : r.id)}
                aria-pressed={sel}
                className={`text-left rounded-2xl p-3.5 transition ${sel ? "is-selected" : "raised"}`}
              >
                <div className="text-2xl leading-none mb-1.5" aria-hidden>{r.icon}</div>
                <div className={`text-sm font-medium ${sel ? "text-ink" : "text-pearl"}`}>{r.label}</div>
                <div className={`text-[11px] ${sel ? "text-ink/70" : "text-pearl-faint"}`}>{r.sub}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
    footer = (
      <Button variant="primary" full onClick={advance}>
        {replacement ? "I'll do this →" : "I'll find something →"}
      </Button>
    );
  } else {
    // reflect
    drankLink = false;
    content = (
      <div className="space-y-5">
        <div className="text-center">
          <h2 className="font-display text-2xl text-pearl">How strong is it now?</h2>
          <p className="text-pearl-soft text-sm mt-2">Notice if it eased. Getting through it is what builds the habit.</p>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-pearl-soft">Craving now</span>
            <span className="tnum text-2xl font-semibold text-pearl">{after}</span>
          </div>
          <Slider id="after" ariaLabel="Craving strength now, 1 to 10" value={after} min={1} max={10} onChange={setAfter} />
          {after < before && <div className="mt-2 text-jade text-sm">Down from {before} to {after}. It eased — and you didn't drink.</div>}
        </div>
        <div className="glass rounded-2xl p-3 text-center text-sm text-pearl-soft">
          That's craving <span className="text-jade font-semibold">#{s.urgesSurfed + 1}</span> you've gotten through
          {after < before ? (
            <> — and it dropped <span className="text-jade font-semibold tnum">{before - after}</span> {before - after === 1 ? "point" : "points"} just now.</>
          ) : (
            "."
          )}
        </div>
      </div>
    );
    footer = (
      <div className="space-y-2.5">
        <Button variant="primary" size="lg" full disabled={done} onClick={() => finish("made_it")}>
          I made it — I didn't drink
        </Button>
        <Button variant="ghost" full disabled={done} onClick={drank}>
          I'm choosing to drink (that's okay)
        </Button>
      </div>
    );
  }

  return (
    <Page>
      <div className="max-w-md mx-auto">
        <CravingStep
          total={steps.length}
          current={idx}
          stepKey={step}
          onExit={exit}
          onDrank={drank}
          onUrgentHelp={urgent}
          footer={footer}
          drankLink={drankLink}
        >
          {content}
        </CravingStep>
      </div>
    </Page>
  );
}
