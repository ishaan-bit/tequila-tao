// src/screens/Onboarding.jsx — under a minute, fully skippable. Captures the
// honest baseline that powers every real number, sets a self-chosen target,
// and seeds one implementation intention (the most evidence-backed habit tool).
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { updateProfile, DEFAULT_PROFILE } from "../app/store.js";
import { useReducedMotion } from "../app/motion.js";
import { currencySymbol, money } from "../app/format.js";
import { startingYinPct, GOALS, BREAK_PRESETS } from "../app/selectors.js";
import { success } from "../app/haptics.js";
import YinYang from "../components/YinYang.jsx";
import { Button, Slider, Stepper, AmountField, Chip } from "../components/ui.jsx";

const INTENTS = Object.values(GOALS); // { id, label, sub, ... } — drives the app
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AUD", "CAD"];

export default function Onboarding() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [p, setP] = useState({ ...DEFAULT_PROFILE });

  const set = (patch) => setP((prev) => ({ ...prev, ...patch }));
  const sym = currencySymbol(p.currency);

  const finish = () => {
    success();
    // Stamp the goal start so the sober-day countdown begins now.
    updateProfile({ ...p, onboarded: true, goalStart: Date.now() });
    navigate("/home", { replace: true });
  };

  const next = () => (step < 3 ? setStep(step + 1) : finish());

  const cards = [
    // 1 — intent
    <div key="intent" className="space-y-5">
      <Heading kicker="Step 1" title="What's your goal?" sub="This shapes your whole plan, not just the tone — and you can change it any time." />
      <div className="grid gap-3">
        {INTENTS.map((it) => {
          const sel = p.intent === it.id;
          return (
            <button
              key={it.id}
              aria-pressed={sel}
              onClick={() => set({ intent: it.id, targetYinRatio: it.defaultTarget, breakDays: it.breakDays || p.breakDays })}
              className={`text-left glass rounded-2xl p-4 transition-all flex items-center justify-between gap-3 ${
                sel ? "ring-2 ring-jade bg-jade/20" : "hover:bg-white/20"
              }`}
            >
              <span>
                <span className={`block font-medium ${sel ? "text-jade" : "text-pearl"}`}>{it.label}</span>
                <span className="block text-sm text-pearl-faint">{it.sub}</span>
              </span>
              <span className={`shrink-0 h-6 w-6 rounded-full grid place-items-center text-xs ${sel ? "bg-jade text-ink" : "border border-white/35"}`}>
                {sel ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>,

    // 2 — baseline
    <div key="baseline" className="space-y-5">
      <Heading kicker="Step 2" title="An honest baseline" sub="So every number reflects your real life — not a fake 50/50." />
      <Slider id="dpw" label={`Drinks in a typical week: ${p.drinksPerWeekBaseline}`} value={p.drinksPerWeekBaseline} min={0} max={30} onChange={(v) => set({ drinksPerWeekBaseline: v })} />
      <div>
        <span className="text-sm text-pearl-soft">Drinks on a typical night out</span>
        <div className="mt-2">
          <Stepper value={p.typicalSession} min={1} max={15} label="drinks per night" onChange={(v) => set({ typicalSession: v })} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-pearl-soft">Typical spend per night</span>
          <span className="relative">
            <select
              value={p.currency}
              onChange={(e) => set({ currency: e.target.value })}
              className="glass rounded-xl pl-3 pr-8 py-1.5 text-sm text-pearl"
              aria-label="Currency"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c} style={{ background: "#141a2e", color: "#f4f1e8" }}>
                  {c}
                </option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-pearl-faint text-xs">▾</span>
          </span>
        </div>
        <div className="mt-2">
          <AmountField value={String(p.spendPerNight)} currencySymbol={sym} onChange={(v) => set({ spendPerNight: Number(v) || 0 })} />
        </div>
      </div>
      <div className="glass rounded-2xl p-3 text-sm text-jade">
        A skipped {p.typicalSession}-drink night ≈ <strong>{money(p.spendPerNight, p.currency)} kept</strong> and {p.typicalSession} drinks avoided.
      </div>
      <p className="text-xs text-pearl-faint text-center">
        This puts your starting balance near <span className="tnum text-pearl-soft">{Math.round(startingYinPct(p))}%</span> alcohol-free — you grow it from here.
      </p>
    </div>,

    // 3 — goal (adapts to the Step-1 choice: balance ratio / break length / abstinence)
    <GoalStep key="target" p={p} set={set} navigate={navigate} />,

    // 4 — why + intention
    <div key="why" className="space-y-4">
      <Heading kicker="Step 4" title="Your why & a plan" sub="Name what you're saving toward, and one if-then plan for tonight." />
      <label className="block">
        <span className="text-sm text-pearl-soft">{money(10000, p.currency)} saved would mean…</span>
        <input
          value={p.rewardGoal.label}
          onChange={(e) => set({ rewardGoal: { ...p.rewardGoal, label: e.target.value } })}
          placeholder="a weekend away"
          className="mt-2 w-full glass rounded-2xl px-4 min-h-touch text-pearl focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
      </label>
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="text-sm text-pearl-soft">My if-then plan</div>
        <label className="block text-sm">
          <span className="text-pearl-faint">When…</span>
          <input
            value={p.intention.trigger}
            onChange={(e) => set({ intention: { ...p.intention, trigger: e.target.value } })}
            className="mt-1 w-full bg-transparent border-b border-white/15 py-1.5 focus:outline-none focus:border-jade"
          />
        </label>
        <label className="block text-sm">
          <span className="text-pearl-faint">I will…</span>
          <input
            value={p.intention.plan}
            onChange={(e) => set({ intention: { ...p.intention, plan: e.target.value } })}
            className="mt-1 w-full bg-transparent border-b border-white/15 py-1.5 focus:outline-none focus:border-jade"
          />
        </label>
      </div>
      <p className="text-xs text-pearl-faint text-center">
        Private &amp; on-device. See the <button onClick={() => navigate("/privacy")} className="underline">privacy note</button>.
      </p>
    </div>,
  ];

  return (
    <main className="app-bg min-h-screen-safe flex flex-col px-safe">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col pt-safe">
        {/* progress + skip */}
        <div className="flex items-center justify-between py-4">
          <div className="flex gap-1.5" aria-hidden>
            {cards.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-jade" : "w-1.5 bg-white/20"}`} />
            ))}
          </div>
          <button onClick={finish} className="text-sm text-pearl-soft hover:text-pearl px-3 min-h-touch">
            Skip for now
          </button>
        </div>

        {/* card */}
        <div className="flex-1 flex flex-col justify-center py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: reduced ? 0 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduced ? 0 : -24 }}
              transition={{ duration: 0.3 }}
            >
              {cards[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* nav */}
        <div className="flex items-center gap-3 py-5 pb-safe">
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <Button variant="primary" full onClick={next}>
            {step < 3 ? "Continue" : "Finish setup"}
          </Button>
        </div>
      </div>
    </main>
  );
}

function Heading({ kicker, title, sub }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-jade mb-1">{kicker}</div>
      <h1 className="font-display text-2xl text-pearl">{title}</h1>
      {sub && <p className="text-sm text-pearl-soft mt-1">{sub}</p>}
    </div>
  );
}

// Step 3 adapts to the goal chosen in Step 1 — this is where each branch finally
// becomes a real, distinct plan instead of the same 50–95% slider for everyone.
function GoalStep({ p, set, navigate }) {
  const startPct = Math.round(startingYinPct(p));
  // ~3+ drinks/day every day flags possible dependence — surface the taper
  // safety note before anyone tries to go cold-turkey. (See Terms / care notice.)
  const heavy = p.drinksPerWeekBaseline >= 21;

  if (p.intent === "break") {
    return (
      <div className="space-y-5">
        <Heading kicker="Step 3" title="How long is your break?" sub="A set, time-boxed stretch fully off alcohol. Even a partial run lowers later drinking and builds your confidence to say no." />
        <div className="grid place-items-center py-1">
          <YinYang yinPct={startPct} targetPct={100} size={168} breath={false} maxYin={100} showSeeds={false} coolYang />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {BREAK_PRESETS.map((d) => (
            <Chip key={d} selected={p.breakDays === d} onClick={() => set({ breakDays: d })}>
              {d} days
            </Chip>
          ))}
        </div>
        <p className="text-sm text-pearl-soft text-center">
          A <span className="tnum text-pearl">{p.breakDays}</span>-day reset — alcohol-free the whole way. We'll count it down with you, day by day.
        </p>
        {heavy && <SafetyNote navigate={navigate} />}
      </div>
    );
  }

  if (p.intent === "quit") {
    return (
      <div className="space-y-5">
        <Heading kicker="Step 3" title="Going alcohol-free" sub="One day at a time. We count every day you stay off it — and if a hard night happens, a slip is a lapse, never the end." />
        <div className="grid place-items-center py-1">
          <YinYang yinPct={startPct} targetPct={100} size={168} breath={false} maxYin={100} showSeeds={false} coolYang />
        </div>
        <div className="glass rounded-2xl p-4 text-sm text-pearl-soft text-center">
          Your goal is a full, clear circle — <span className="text-jade">100% alcohol-free</span>. The app leads with your <span className="text-pearl">days alcohol-free</span> and protects every one of them.
        </div>
        {heavy && <SafetyNote navigate={navigate} />}
      </div>
    );
  }

  // cutback (default) — a realistic moderation target, never forced to 100%.
  return (
    <div className="space-y-5">
      <Heading kicker="Step 3" title="Set your goal" sub="Aim for a realistic balance — not a perfect, alcohol-free circle." />
      <div className="grid place-items-center py-1">
        <YinYang yinPct={startPct} targetPct={Math.round(p.targetYinRatio * 100)} size={168} breath={false} />
      </div>
      <p className="text-sm text-pearl-soft text-center">
        You're starting near <span className="tnum text-pearl">{startPct}%</span> alcohol-free. The dashed line is your goal:{" "}
        <span className="tnum text-pearl">{Math.round(p.targetYinRatio * 100)}%</span>.
      </p>
      <Slider id="target" label={`Goal: alcohol-free on ${Math.round(p.targetYinRatio * 100)}% of nights`} value={Math.round(p.targetYinRatio * 100)} min={50} max={95} onChange={(v) => set({ targetYinRatio: v / 100 })} />
      <p className="text-xs text-pearl-faint text-center">You don't have to aim for 100%. Choosing to drink sometimes is allowed.</p>
    </div>
  );
}

function SafetyNote({ navigate }) {
  return (
    <div className="rounded-2xl p-3 text-sm" style={{ background: "rgba(255,107,94,0.12)", border: "1px solid rgba(255,107,94,0.4)" }}>
      <span className="text-danger font-semibold">One safety note. </span>
      <span className="text-pearl-soft">
        If you drink heavily every day, stopping suddenly can be dangerous. Please taper with a clinician's help —{" "}
      </span>
      <button onClick={() => navigate("/terms")} className="underline text-pearl-soft hover:text-pearl">
        see safety info
      </button>
      .
    </div>
  );
}
