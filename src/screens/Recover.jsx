// src/screens/Recover.jsx — Soft Landing. Gentle, de-jargoned morning-after care
// + an honest reflection. Self-care literally grows your yin. The safety card is
// the one place alarm colour is allowed, because it matters.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useProfile } from "../app/hooks.js";
import { addEvent } from "../app/store.js";
import { currencySymbol } from "../app/format.js";
import { success } from "../app/haptics.js";
import Page, { BackHeader } from "../components/Page.jsx";
import { Button, MoodPicker, AmountField, IconBadge } from "../components/ui.jsx";
import { DropletIcon, LungsIcon, ForkIcon, CoffeeIcon, ShieldCheckIcon, SplashIcon, WalkIcon, CheckIcon } from "../components/icons.jsx";

const CHECKS = [
  { id: "hydrate", title: "Hydrate", why: "300–500 ml, slow sips. Eases the headache and the jitters.", required: true, icon: DropletIcon, tone: "moonstone" },
  { id: "breath", title: "Calming breath (1 min)", why: "In 4 · hold 2 · out 6. The longer out-breath settles the nervous system.", required: true, guide: true, icon: LungsIcon, tone: "teal" },
  { id: "fuel", title: "Light fuel", why: "Carbs + protein steady blood sugar — toast & eggs, banana & yogurt.", required: true, icon: ForkIcon, tone: "amber" },
  { id: "caffeine", title: "Easy on the caffeine", why: "Delay it 60–90 min if you can; the jitters settle faster.", required: true, icon: CoffeeIcon, tone: "ember" },
  { id: "safety", title: "Safety check", why: "No chest pain, confusion, or relentless vomiting? Good.", required: true, icon: ShieldCheckIcon, tone: "jade" },
  { id: "cool", title: "Cooling rinse", why: "A face splash or lukewarm shower can reset you.", required: false, icon: SplashIcon, tone: "focus" },
  { id: "move", title: "Gentle movement", why: "Neck rolls, a short walk. Nothing heroic.", required: false, icon: WalkIcon, tone: "sage" },
];

function Ring({ pct }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="var(--color-jade)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (pct / 100) * c}
        transform="rotate(-90 32 32)"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

export default function Recover() {
  const navigate = useNavigate();
  const profile = useProfile();
  const [done, setDone] = useState(() => new Set());
  const [mood, setMood] = useState(null);
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [trigger, setTrigger] = useState("");
  const [saved, setSaved] = useState(false);

  const toggle = (id) => {
    success();
    setDone((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const requiredIds = useMemo(() => CHECKS.filter((c) => c.required).map((c) => c.id), []);
  const requiredDone = requiredIds.every((id) => done.has(id));
  const pct = Math.round((done.size / CHECKS.length) * 100);

  const finish = () => {
    if (saved) return;
    setSaved(true);
    const ev = addEvent("soft_landing", {
      mood: mood ?? null,
      note: note.trim(),
      trigger: trigger.trim(),
      costRough: Number(cost) || 0,
    });
    setTimeout(
      () => navigate("/home", { replace: true, state: { justLogged: { id: ev.id, label: "Logged morning-after care." } } }),
      700
    );
  };

  return (
    <Page>
      <div className="max-w-md mx-auto">
        <BackHeader title="Morning-after recovery" onBack={() => navigate("/home")} />
        <div className="px-safe pb-gutter">
          {/* header + ring */}
          <div className="flex items-center gap-4 glass rounded-3xl p-4 mb-3">
            <Ring pct={pct} />
            <div>
              <div className="font-display text-lg text-pearl">{pct < 40 ? "Still rough" : pct < 100 ? "Feeling better" : "All done"}</div>
              <div className="text-sm text-pearl-soft">A few small kindnesses. Rough morning is data, not failure.</div>
            </div>
          </div>

          {/* safety card (alarm colour intentionally allowed here) */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,107,94,0.12)", border: "1px solid rgba(255,107,94,0.45)" }}>
            <div className="text-danger font-semibold text-sm">Safety first</div>
            <p className="text-sm text-pearl-soft mt-1">
              Severe symptoms — chest pain, confusion, seizures, relentless vomiting, or withdrawal shakes — need real care now.{" "}
              <button onClick={() => navigate("/terms")} className="underline">
                See safety & crisis info
              </button>
              .
            </p>
          </div>

          {/* checklist */}
          <div className="space-y-3">
            {CHECKS.map((c) => {
              const checked = done.has(c.id);
              const Ico = c.icon;
              return (
                <motion.button
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  whileTap={{ scale: 0.99 }}
                  aria-pressed={checked}
                  className={`w-full text-left rounded-2xl p-4 flex items-start gap-3.5 transition-all ${checked ? "bg-jade/10 ring-1 ring-jade/45 shadow-[0_10px_24px_-18px_rgba(94,201,138,0.7)]" : "glass"}`}
                >
                  <IconBadge tone={checked ? "jade" : c.tone}>
                    {checked ? <CheckIcon size={20} stroke={2.4} /> : <Ico size={20} />}
                  </IconBadge>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="text-pearl font-medium">{c.title}</span>
                      {!c.required && <span className="text-[10px] text-pearl-soft rounded-full bg-white/10 px-2 py-0.5">optional</span>}
                    </span>
                    <span className="block text-sm text-pearl-soft mt-0.5">{c.why}</span>
                    {c.guide && checked && (
                      <span className="block text-xs text-pearl-soft mt-1.5">Inhale 4 · hold 2 · exhale 6. Repeat gently. The slow out-breath is what calms you.</span>
                    )}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* reflection */}
          <div className="glass rounded-3xl p-5 mt-4 space-y-4">
            <div>
              <div className="text-sm text-pearl-soft mb-2.5">How do you feel now?</div>
              <MoodPicker value={mood} onChange={setMood} />
            </div>
            <label className="block">
              <span className="text-sm text-pearl-soft">Roughly, what did last night cost? (optional)</span>
              <div className="mt-2">
                <AmountField value={cost} ariaLabel="What last night cost" currencySymbol={currencySymbol(profile.currency)} onChange={setCost} />
              </div>
            </label>
            {/* Externalize the cause (a situation you can plan for) rather than
                internalize it (a personal failing) — the AVE-interrupt that keeps a
                lapse from spiraling into relapse (Marlatt). */}
            <label className="block">
              <span className="text-sm text-pearl-soft">What set it off? (optional)</span>
              <input
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                className="mt-2 w-full glass rounded-2xl px-4 min-h-touch text-sm text-pearl focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                placeholder="a place, a feeling, certain people…"
              />
              <span className="block text-xs text-pearl-faint mt-1.5">Naming the trigger makes it something to plan for — not a personal failing.</span>
            </label>
            <label className="block">
              <span className="text-sm text-pearl-soft">What would you tell a friend who had last night? (optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="mt-2 w-full glass rounded-2xl p-3 text-sm focus:outline-none resize-none"
                placeholder="Say it to yourself, too…"
              />
            </label>
          </div>

          <div className="mt-4">
            <Button variant="primary" full disabled={!requiredDone || saved} onClick={finish}>
              {saved ? "Done ✓" : requiredDone ? "Finish recovery" : "Check off the required steps first"}
            </Button>
          </div>
        </div>
      </div>
    </Page>
  );
}
