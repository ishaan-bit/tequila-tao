// src/screens/Sendoff.jsx — the "I'm having some" path. Warm but mindful and
// harm-reducing. No shame, no red. Honesty is safe here. A night you set out to
// drink but didn't (0 drinks) is logged as the alcohol-free WIN it is — never
// forced into over-reporting a fake drink. Drinking-cue imagery is dialled down
// (and removed entirely for abstinence goals, who may have reached this via a
// lapse) to avoid cue-reactivity.
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProfile, useStats, useStore } from "../app/hooks.js";
import { addEvent, removeEvent } from "../app/store.js";
import { currencySymbol } from "../app/format.js";
import { localDayKey, dayKeyOffset, dayKeyToLogTs, dayLabel } from "../app/selectors.js";
import { tap } from "../app/haptics.js";
import Page, { BackHeader } from "../components/Page.jsx";
import LazyVideo from "../components/LazyVideo.jsx";
import { Button, Stepper, AmountField, WhenToggle } from "../components/ui.jsx";

const KIT = [
  { id: "water", label: "Water between rounds" },
  { id: "limit", label: "Set a limit & stick to it" },
  { id: "eat", label: "Eat something first" },
  { id: "ride", label: "Plan a safe ride home" },
];

export default function Sendoff() {
  const navigate = useNavigate();
  const { state: navState } = useLocation();
  const profile = useProfile();
  const s = useStats();
  const store = useStore();
  const [drinks, setDrinks] = useState(navState?.drinks ?? profile.typicalSession ?? 3);
  const [spend, setSpend] = useState(String(profile.spendPerNight || 0));
  const [freeze, setFreeze] = useState(false);
  const [kit, setKit] = useState([]);
  const [promise, setPromise] = useState(false);
  const [trigger, setTrigger] = useState(""); // optional: what made tonight hard
  const [done, setDone] = useState(false);

  const canFreeze = s.freezesRemaining > 0;
  const isZero = Number(drinks) === 0;

  // Carried from Urge's "I'm choosing to drink" branch — logged here (deferred)
  // so abandoning this screen doesn't leave a phantom failed craving.
  const fromUrge = navState?.fromUrge;

  // Which night (a tapped past day passes forDay; else Tonight / Last night).
  const forDay = navState?.forDay || null;
  const todayKey = localDayKey(Date.now());
  const [when, setWhen] = useState("today");
  const targetDay = forDay || (when === "last" ? dayKeyOffset(1) : todayKey);
  const isToday = targetDay === todayKey;
  const logTs = isToday ? undefined : dayKeyToLogTs(targetDay);

  const toggleKit = (id) => {
    tap();
    setKit((k) => (k.includes(id) ? k.filter((x) => x !== id) : [...k, id]));
  };

  const confirm = () => {
    if (done) return;
    setDone(true);

    // Replace the target day's existing decision so a day is never both clear and
    // a drink night, and re-logging can't double-count.
    (store.events || []).forEach((e) => {
      if ((e.type === "clear_night" || e.type === "drink_night") && localDayKey(e.ts) === targetDay) {
        removeEvent(e.id);
      }
    });

    if (fromUrge) {
      addEvent("urge_surf", { before: navState.before, after: navState.after, outcome: "drank" });
    }

    let ev;
    if (isZero) {
      // Set out to drink, had none → an alcohol-free night, credited as the win.
      ev = addEvent(
        "clear_night",
        { moneySaved: Number(profile.spendPerNight) || 0, drinksAvoided: profile.typicalSession || 1, currency: profile.currency },
        logTs
      );
    } else {
      ev = addEvent(
        "drink_night",
        {
          drinks: Number(drinks),
          spend: Number(spend) || 0,
          currency: profile.currency,
          frozen: freeze && canFreeze && !s.isAbstinence,
          harmKit: [...kit, ...(promise ? ["clear-promise"] : [])],
          trigger: trigger.trim(),
        },
        logTs
      );
    }

    navigate("/home", {
      replace: true,
      state: {
        justLogged: {
          id: ev.id,
          label: isZero ? "Logged alcohol-free — you resisted." : "Logged honestly.",
          day: targetDay,
        },
      },
    });
  };

  const showVideo = !s.isAbstinence; // no festive drinking cue for break/quit goals

  return (
    <Page>
      <div className="relative">
        {showVideo && (
          <div className="absolute inset-0 -z-0 h-56 opacity-40" aria-hidden>
            <LazyVideo src="/media/party.mp4" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,11,20,0.35), var(--bg-base))" }} />
          </div>
        )}
        <div className="relative z-10 max-w-md mx-auto">
          <BackHeader title={isZero ? "Tonight" : "Drinking tonight"} onBack={() => navigate(forDay ? "/home" : "/crossroads")} />
          <div className="px-safe pb-gutter space-y-4">
            <div className="text-center pt-2 pb-1">
              <h2 className="font-display text-2xl text-pearl">
                {isZero
                  ? "Changed your mind? That's a win."
                  : s.isAbstinence
                  ? "Tonight didn't go to plan — that's okay"
                  : "Drinking tonight — let's keep it safe"}
              </h2>
              <p className="text-sm text-pearl-soft mt-1">
                {isZero
                  ? "Set the drinks to zero and we'll log tonight as alcohol-free — no fake drink, just the win."
                  : s.isAbstinence
                  ? "Let's keep you safe tonight. A lapse isn't a relapse — your day count restarts, but your best run and every lifetime total stay. Begin again tomorrow."
                  : "Have a good one. We'll log it honestly and keep your history safe."}
              </p>
            </div>

            {!forDay && <WhenToggle value={when} onChange={setWhen} />}
            {forDay && !isToday && (
              <div className="text-sm text-pearl-faint text-center">Logging for <span className="text-pearl-soft">{dayLabel(targetDay)}</span>.</div>
            )}

            <div className="glass rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-pearl-soft">Drinks tonight (a rough guess is fine)</span>
              </div>
              <div className="flex justify-center">
                <Stepper value={drinks} min={0} max={20} label="drinks" onChange={setDrinks} />
              </div>
              {!isZero && (
                <label className="block">
                  <span className="text-sm text-pearl-soft">Spend (optional)</span>
                  <div className="mt-2">
                    <AmountField value={spend} ariaLabel="Spend tonight" currencySymbol={currencySymbol(profile.currency)} onChange={setSpend} />
                  </div>
                </label>
              )}
              {isZero && (
                <div className="glass rounded-2xl p-3 text-sm text-jade">
                  Tonight will be saved as alcohol-free — money kept and drinks avoided, just like any clear night. 🌿
                </div>
              )}
            </div>

            {/* The harm-reduction tools only apply to an actual drink night. */}
            {!isZero && (
              <>
                {/* freeze — moderation only. For abstinence there's no "protected"
                    drink, so it's hidden and the sober count resets honestly. */}
                {!s.isAbstinence && (
                  <button
                    onClick={() => canFreeze && setFreeze((v) => !v)}
                    disabled={!canFreeze}
                    aria-pressed={freeze}
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

                {/* keep one clear thing */}
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

                {/* recovery-oriented reflection — externalize the cause (a situation
                    to plan for) rather than internalize it (a personal failing). */}
                <label className="block glass rounded-2xl p-4">
                  <span className="text-sm text-pearl-soft">What made tonight hard? (optional)</span>
                  <input
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                    placeholder="a place, a feeling, certain people…"
                    className="mt-2 w-full glass rounded-xl px-4 min-h-touch text-sm text-pearl focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  />
                  <span className="block text-xs text-pearl-faint mt-1.5">Naming it makes it something to plan for — not a personal failing.</span>
                </label>
              </>
            )}

            <Button variant={isZero ? "primary" : "glass"} size="lg" full disabled={done} onClick={confirm}>
              {done ? "Saved ✓" : isZero ? "Save as alcohol-free 🌿" : "Save tonight"}
            </Button>
            {!isZero && (
              <div className="glass rounded-2xl p-4 text-center text-sm text-pearl-soft">
                Your progress is still here — money kept and drinks avoided don't move, and your best run still stands.
                <span className="block text-pearl-faint mt-1">Tomorrow morning, tap <span className="text-pearl">Morning after</span> for a few small things to feel better.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
