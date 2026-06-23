// src/screens/Sendoff.jsx — the "I'm having some" path. Warm and celebratory,
// but mindful and harm-reducing. No shame, no red. Honesty is safe here.
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProfile, useStats } from "../app/hooks.js";
import { addEvent } from "../app/store.js";
import { currencySymbol } from "../app/format.js";
import { tap } from "../app/haptics.js";
import Page, { BackHeader } from "../components/Page.jsx";
import LazyVideo from "../components/LazyVideo.jsx";
import { Button, Stepper, AmountField } from "../components/ui.jsx";

const KIT = [
  { id: "water", label: "Water between rounds" },
  { id: "limit", label: "Set a limit & stick to it" },
  { id: "eat", label: "Eat something first" },
  { id: "ride", label: "Plan a safe ride home" },
];

export default function Sendoff() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const profile = useProfile();
  const s = useStats();
  const [drinks, setDrinks] = useState(state?.drinks ?? profile.typicalSession ?? 3);
  const [spend, setSpend] = useState(String(profile.spendPerNight || 0));
  const [freeze, setFreeze] = useState(false);
  const [kit, setKit] = useState([]);
  const [promise, setPromise] = useState(false);
  const [done, setDone] = useState(false);

  const canFreeze = s.freezesRemaining > 0;

  const toggleKit = (id) => {
    tap();
    setKit((k) => (k.includes(id) ? k.filter((x) => x !== id) : [...k, id]));
  };

  const confirm = () => {
    if (done) return;
    setDone(true);
    addEvent("drink_night", {
      drinks,
      spend: Number(spend) || 0,
      currency: profile.currency,
      frozen: freeze && canFreeze,
      harmKit: [...kit, ...(promise ? ["clear-promise"] : [])],
    });
    setTimeout(() => navigate("/home", { replace: true }), 700);
  };

  return (
    <Page>
      <div className="relative">
        <div className="absolute inset-0 -z-0 h-64">
          <LazyVideo src="/media/party.mp4" />
        </div>
        <div className="relative z-10 max-w-md mx-auto">
          <BackHeader title="Drinking tonight" onBack={() => navigate("/home")} />
          <div className="px-safe pb-16 space-y-4">
            <div className="text-center pt-2 pb-1">
              <h2 className="font-display text-2xl text-pearl">
                {s.isAbstinence ? "Tonight didn't go to plan — that's okay" : "Drinking tonight — let's keep it safe 🥂"}
              </h2>
              <p className="text-sm text-pearl-soft mt-1">
                {s.isAbstinence
                  ? "Let's keep you safe tonight. A lapse isn't a relapse — log it honestly and your progress stays."
                  : "Have a good one. We'll log it honestly and keep your history safe."}
              </p>
            </div>

            <div className="glass rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-pearl-soft">Drinks tonight (a rough guess is fine)</span>
              </div>
              <div className="flex justify-center">
                <Stepper value={drinks} min={1} max={20} label="drinks" onChange={setDrinks} />
              </div>
              <label className="block">
                <span className="text-sm text-pearl-soft">Spend (optional)</span>
                <div className="mt-2">
                  <AmountField value={spend} currencySymbol={currencySymbol(profile.currency)} onChange={setSpend} />
                </div>
              </label>
            </div>

            {/* freeze — a moderation feature only. For an abstinence goal there is
                no "protected" drink, so we hide it and let the sober count reset
                honestly (a lapse, handled with care, not a loophole). */}
            {!s.isAbstinence && (
              <button
                onClick={() => canFreeze && setFreeze((v) => !v)}
                disabled={!canFreeze}
                className={`w-full text-left glass rounded-2xl p-4 transition-colors ${freeze ? "ring-2 ring-moonstone bg-moonstone/25" : ""} ${!canFreeze ? "opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-pearl font-medium">🛡️ Protect my streak</span>
                  <span className="text-xs text-pearl-faint">{s.freezesRemaining} left this week</span>
                </div>
                <p className="text-sm text-pearl-faint mt-0.5">A planned night won't break your run. (2 free a week.)</p>
              </button>
            )}

            {/* safety kit */}
            <div className="glass rounded-3xl p-5">
              <div className="text-sm text-pearl-soft mb-3">Safety kit — pick what helps</div>
              <div className="grid grid-cols-2 gap-2">
                {KIT.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => toggleKit(k.id)}
                    aria-pressed={kit.includes(k.id)}
                    className={`text-left rounded-2xl p-3 text-sm transition-colors ${kit.includes(k.id) ? "is-selected font-medium" : "glass text-pearl-soft hover:bg-white/20"}`}
                  >
                    {kit.includes(k.id) ? "✓ " : ""}
                    {k.label}
                  </button>
                ))}
              </div>
            </div>

            {/* keep one clear thing (yang seed promise) */}
            <button
              onClick={() => {
                tap();
                setPromise((v) => !v);
              }}
              role="switch"
              aria-checked={promise}
              className={`w-full text-left glass rounded-2xl p-4 transition-colors ${promise ? "ring-2 ring-pearl/50 bg-white/10" : ""}`}
            >
              <span className="flex items-center gap-2.5">
                <span className={`shrink-0 h-5 w-5 rounded-full border grid place-items-center text-xs ${promise ? "bg-pearl border-pearl text-ink" : "border-white/40"}`}>
                  {promise ? "✓" : ""}
                </span>
                <span className="text-pearl font-medium">Promise one safe choice tonight</span>
              </span>
              <p className="text-sm text-pearl-faint mt-1 pl-[1.875rem]">e.g. water between drinks, or a safe ride home.</p>
            </button>

            <Button variant="warm" full disabled={done} onClick={confirm}>
              {done ? "Saved ✓ Have a good one" : "Save & continue"}
            </Button>
            <p className="text-center text-xs text-pearl-faint">Your money kept & drinks avoided stay exactly where they are.</p>
          </div>
        </div>
      </div>
    </Page>
  );
}
