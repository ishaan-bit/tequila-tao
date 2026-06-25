// src/screens/Clarity.jsx — capture the concrete, permanent reward of a clear night.
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProfile, useStats, useStore } from "../app/hooks.js";
import { addEvent, awardCard, removeEvent } from "../app/store.js";
import {
  CLEAR_STREAK_MILESTONES,
  MONEY_MILESTONES,
  localDayKey,
  dayKeyOffset,
  dayKeyToLogTs,
  dayLabel,
} from "../app/selectors.js";
import { money, currencySymbol } from "../app/format.js";
import { success, milestone as hMilestone } from "../app/haptics.js";
import { play } from "../app/sound.js";
import Page, { BackHeader } from "../components/Page.jsx";
import YinYang from "../components/YinYang.jsx";
import { Button, AmountField, Stepper, WhenToggle } from "../components/ui.jsx";
import { Bloom } from "../components/Feedback.jsx";

export default function Clarity() {
  const navigate = useNavigate();
  const { state: navState } = useLocation();
  const profile = useProfile();
  const s = useStats();
  const store = useStore();
  const [amount, setAmount] = useState(String(profile.spendPerNight || 0));
  const [drinks, setDrinks] = useState(profile.typicalSession || 3);
  const [bloom, setBloom] = useState(null);
  const [done, setDone] = useState(false);

  // Which night are we logging? A tap on a past day cell passes `forDay`; from the
  // nightly flow you pick Tonight / Last night so a forgotten night can be filled.
  const forDay = navState?.forDay || null;
  const todayKey = localDayKey(Date.now());
  const [when, setWhen] = useState("today");
  const targetDay = forDay || (when === "last" ? dayKeyOffset(1) : todayKey);
  const isToday = targetDay === todayKey;
  const logTs = isToday ? undefined : dayKeyToLogTs(targetDay);

  const moneySaved = Number(amount) || 0;

  const confirm = () => {
    if (done) return;
    setDone(true);
    // Replace the target day's existing decision (clear or drink) so the day is
    // unambiguously alcohol-free and nothing double-counts.
    (store.events || []).forEach((e) => {
      if ((e.type === "clear_night" || e.type === "drink_night") && localDayKey(e.ts) === targetDay) {
        removeEvent(e.id);
      }
    });
    const ev = addEvent("clear_night", { moneySaved, drinksAvoided: drinks, currency: profile.currency }, logTs);
    success();
    play("clear", 0.5);

    // Milestone celebration is only meaningful for tonight's live streak; a
    // backfill of a past night just saves quietly (totals recompute on their own).
    if (isToday) {
      const newStreak = s.clearToday ? s.currentClearStreak : s.currentClearStreak + 1;
      const newMoney = s.moneyKept + moneySaved;
      const hitStreak = CLEAR_STREAK_MILESTONES.includes(newStreak);
      const crossedMoney = MONEY_MILESTONES.find((m) => s.moneyKept < m && newMoney >= m);
      if (hitStreak || crossedMoney) {
        hMilestone();
        play("milestone", 0.5);
        awardCard({
          key: `m-${hitStreak ? newStreak + "n" : "money-" + crossedMoney}`,
          name: hitStreak ? `${newStreak} clear nights` : `${money(crossedMoney, profile.currency)} kept`,
          kind: hitStreak ? "streak" : "money",
          n: hitStreak ? newStreak : crossedMoney,
          rarity: "milestone",
          unique: true,
        });
        setBloom({
          title: hitStreak ? `${newStreak} clear nights` : `${money(crossedMoney, profile.currency)} kept`,
          lines: [
            `${money(newMoney, profile.currency)} kept · ${s.drinksAvoided + drinks} drinks avoided`,
            profile.rewardGoal?.label ? `That's real progress toward ${profile.rewardGoal.label}.` : "Quietly, steadily, you're building something.",
          ],
        });
        return;
      }
    }
    navigate("/home", {
      replace: true,
      state: { justLogged: { id: ev.id, label: isToday ? "Logged alcohol-free." : `Logged ${dayLabel(targetDay).toLowerCase()} as alcohol-free.`, day: targetDay } },
    });
  };

  return (
    <Page>
      <div className="max-w-md mx-auto">
        <BackHeader title="Log alcohol-free night" onBack={() => navigate(forDay ? "/home" : "/crossroads")} />
        <div className="px-safe pb-gutter">
          <div className="grid place-items-center py-2">
            <YinYang
              yinPct={s.isAbstinence ? s.displayYinPct : done ? Math.min(95, s.yinPct + 6) : s.yinPct}
              targetPct={s.targetPct}
              size={150}
              breath={!done}
              maxYin={s.isAbstinence ? 100 : 95}
              showSeeds={!s.isAbstinence}
              showTarget={!s.isAbstinence}
              coolYang={s.isAbstinence}
            />
          </div>

          <div className="glass rounded-3xl p-5 mt-2 space-y-4">
            <div>
              <h2 className="font-display text-xl text-pearl">Save tonight as alcohol-free</h2>
              <p className="text-sm text-pearl-soft mt-1">Nice choice. Edit anything that's off, then save.</p>
            </div>

            {/* which night (hidden when a specific day was tapped) */}
            {!forDay && <WhenToggle value={when} onChange={setWhen} />}
            {forDay && !isToday && (
              <div className="text-sm text-pearl-faint">Logging for <span className="text-pearl-soft">{dayLabel(targetDay)}</span>.</div>
            )}

            <label className="block">
              <span className="text-sm text-pearl-soft">How much would you have spent on drinks tonight?</span>
              <div className="mt-2">
                <AmountField
                  value={amount}
                  ariaLabel="Money you'd have spent on drinks"
                  currencySymbol={currencySymbol(profile.currency)}
                  onChange={setAmount}
                />
              </div>
            </label>

            <div>
              <span className="text-sm text-pearl-soft">Drinks avoided</span>
              <div className="mt-2">
                <Stepper value={drinks} min={0} max={20} label="drinks avoided" onChange={setDrinks} />
              </div>
            </div>

            <div className="glass rounded-2xl p-3 text-sm text-jade">
              +{money(moneySaved, profile.currency)} kept · +{drinks} drinks avoided
              {isToday && <> · streak → {s.clearToday ? s.currentClearStreak : s.currentClearStreak + 1}</>}
            </div>

            <Button variant="primary" size="lg" full disabled={done} onClick={confirm}>
              {done ? "Saved ✓" : "Save it"}
            </Button>
          </div>
        </div>
      </div>

      <Bloom show={!!bloom} title={bloom?.title} lines={bloom?.lines || []} cta="Done" onClose={() => navigate("/home", { replace: true })} />
    </Page>
  );
}
