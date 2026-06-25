// src/screens/Crossroads.jsx — the nightly decision. Two equal-weight paths,
// no guilt styling, with a pause + your own intention as a reminder.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useProfile, useStats } from "../app/hooks.js";
import { money } from "../app/format.js";
import Page, { BackHeader } from "../components/Page.jsx";
import { Button, Slider, Stepper } from "../components/ui.jsx";

export default function Crossroads() {
  const navigate = useNavigate();
  const profile = useProfile();
  const s = useStats();
  const [feeling, setFeeling] = useState(3);
  const [drinks, setDrinks] = useState(profile.typicalSession || 3);
  const [expandDrink, setExpandDrink] = useState(false);

  const strong = feeling >= 6;

  return (
    <Page>
      <div className="max-w-md mx-auto">
        <BackHeader title="Tonight" onBack={() => navigate("/home")} />
        <div className="px-safe pb-gutter space-y-5">
          {/* goal context — abstinence goals lead with where you are in the run */}
          {s.isAbstinence && (
            <div className="text-center text-sm text-pearl-soft">
              {s.goalType === "break"
                ? `Day ${Math.min(s.breakElapsed, s.breakLen)} of ${s.breakLen} · ${s.breakDaysLeft} ${s.breakDaysLeft === 1 ? "day" : "days"} to go`
                : `${s.soberDays} ${s.soberDays === 1 ? "day" : "days"} alcohol-free — let's keep it going.`}
            </div>
          )}

          {/* feeling check */}
          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-pearl-soft">How strong is the urge to drink tonight?</span>
              <span className="tnum text-lg text-pearl">{feeling}/10</span>
            </div>
            <Slider id="feeling" ariaLabel="Urge to drink tonight, 1 to 10" value={feeling} min={1} max={10} onChange={setFeeling} />
            <AnimatePresence>
              {strong && (
                <motion.button
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={() => navigate("/urge")}
                  className="mt-2 w-full text-left text-sm text-amber glass rounded-2xl p-3 min-h-touch"
                >
                  That's a strong craving. Try a 3-minute calming exercise first? →
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* intention reminder */}
          {profile.intention?.trigger && (
            <div className="text-sm text-pearl-faint text-center px-2">
              Your plan: when <span className="text-pearl-soft">{profile.intention.trigger}</span>, you'll{" "}
              <span className="text-pearl-soft">{profile.intention.plan}</span>.
            </div>
          )}

          {/* two paths */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/clarity")}
              className="w-full text-left glass rounded-3xl p-5 hover:bg-white/10 transition-colors active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-xl text-pearl">{s.isAbstinence ? "Staying alcohol-free" : "Not drinking tonight"}</span>
                <span className="text-jade text-sm">
                  {s.isAbstinence ? `day ${s.soberDays}` : `streak → ${s.clearToday ? s.currentClearStreak : s.currentClearStreak + 1}`}
                </span>
              </div>
              <p className="text-sm text-pearl-soft mt-1">
                {s.isAbstinence
                  ? `Staying on track. ≈ ${money(profile.spendPerNight, profile.currency)} kept, ${profile.typicalSession} drinks not had.`
                  : `Alcohol-free by choice. ≈ ${money(profile.spendPerNight, profile.currency)} kept, ${profile.typicalSession} drinks avoided.`}
              </p>
            </button>

            <div className="glass rounded-3xl p-5" style={{ borderColor: "rgba(224,150,47,0.22)" }}>
              <button onClick={() => setExpandDrink((v) => !v)} className="w-full text-left">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl text-pearl">{s.isAbstinence ? "I'm having a drink" : "I'm going to drink"}</span>
                  <span className="text-pearl-faint text-sm">{s.isAbstinence ? "log it honestly" : "no shame"}</span>
                </div>
                <p className="text-sm text-pearl-soft mt-1">
                  {s.isAbstinence
                    ? "If tonight got away from you, log it honestly — a lapse isn't a relapse. Your day count restarts, but your best run and every lifetime total stay."
                    : "No shame. We'll log it honestly and keep your history safe."}
                </p>
              </button>
              <AnimatePresence>
                {expandDrink && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 flex flex-col items-center gap-3">
                      <span className="text-sm text-pearl-soft">How many drinks, roughly?</span>
                      <Stepper value={drinks} min={0} max={20} label="drinks" onChange={setDrinks} />
                      {drinks === 0 && (
                        <p className="text-xs text-jade text-center">Zero drinks? That's an alcohol-free night — we'll log it as the win it is.</p>
                      )}
                      <Button
                        variant={drinks === 0 ? "primary" : "glass"}
                        full
                        onClick={() =>
                          drinks === 0
                            ? navigate("/clarity")
                            : navigate("/sendoff", { state: { drinks } })
                        }
                      >
                        Continue
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button onClick={() => navigate("/urge")} className="block mx-auto text-sm text-pearl-soft underline underline-offset-4 decoration-white/30 hover:text-pearl min-h-touch">
            Not sure? Take a minute with a calming exercise →
          </button>
        </div>
      </div>
    </Page>
  );
}
