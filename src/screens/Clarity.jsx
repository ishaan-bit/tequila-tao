// src/screens/Clarity.jsx — capture the concrete, permanent reward of a clear night.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile, useStats } from "../app/hooks.js";
import { addEvent, awardCard } from "../app/store.js";
import { CLEAR_STREAK_MILESTONES, MONEY_MILESTONES } from "../app/selectors.js";
import { money, currencySymbol } from "../app/format.js";
import { success, milestone as hMilestone } from "../app/haptics.js";
import { play } from "../app/sound.js";
import Page, { BackHeader } from "../components/Page.jsx";
import YinYang from "../components/YinYang.jsx";
import { Button, AmountField, Stepper } from "../components/ui.jsx";
import { Bloom } from "../components/Feedback.jsx";

export default function Clarity() {
  const navigate = useNavigate();
  const profile = useProfile();
  const s = useStats();
  const [amount, setAmount] = useState(String(profile.spendPerNight || 0));
  const [drinks, setDrinks] = useState(profile.typicalSession || 3);
  const [bloom, setBloom] = useState(null);
  const [done, setDone] = useState(false);

  const moneySaved = Number(amount) || 0;

  const confirm = () => {
    if (done) return;
    setDone(true);
    addEvent("clear_night", { moneySaved, drinksAvoided: drinks, currency: profile.currency });
    success();
    play("clear", 0.5);

    const newStreak = s.clearToday ? s.currentClearStreak : s.currentClearStreak + 1;
    const newMoney = s.moneyKept + moneySaved;
    const hitStreak = CLEAR_STREAK_MILESTONES.includes(newStreak);
    const crossedMoney = MONEY_MILESTONES.find((m) => s.moneyKept < m && newMoney >= m);

    if (hitStreak || crossedMoney) {
      hMilestone();
      play("milestone", 0.5);
      awardCard({ key: `m-${hitStreak ? newStreak + "n" : "money-" + crossedMoney}`, name: hitStreak ? `${newStreak} clear nights` : `${money(crossedMoney, profile.currency)} kept`, rarity: "milestone", unique: true });
      setBloom({
        title: hitStreak ? `${newStreak} clear nights` : `${money(crossedMoney, profile.currency)} kept`,
        lines: [
          `${money(newMoney, profile.currency)} kept · ${s.drinksAvoided + drinks} drinks avoided`,
          profile.rewardGoal?.label ? `That's real progress toward ${profile.rewardGoal.label}.` : "Quietly, steadily, you're building something.",
        ],
      });
    } else {
      setTimeout(() => navigate("/home", { replace: true }), 850);
    }
  };

  return (
    <Page>
      <div className="max-w-md mx-auto">
        <BackHeader title="Log alcohol-free night" onBack={() => navigate("/crossroads")} />
        <div className="px-safe pb-16">
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

            <label className="block">
              <span className="text-sm text-pearl-soft">How much would you have spent on drinks tonight?</span>
              <div className="mt-2">
                <AmountField value={amount} currencySymbol={currencySymbol(profile.currency)} onChange={setAmount} />
              </div>
            </label>

            <div>
              <span className="text-sm text-pearl-soft">Drinks avoided</span>
              <div className="mt-2">
                <Stepper value={drinks} min={0} max={20} label="drinks avoided" onChange={setDrinks} />
              </div>
            </div>

            <div className="glass rounded-2xl p-3 text-sm text-jade">
              +{money(moneySaved, profile.currency)} kept · +{drinks} drinks avoided · streak → {s.clearToday ? s.currentClearStreak : s.currentClearStreak + 1}
            </div>

            <Button variant="primary" full disabled={done} onClick={confirm}>
              {done ? "Saved ✓" : "Save it"}
            </Button>
          </div>
        </div>
      </div>

      <Bloom show={!!bloom} title={bloom?.title} lines={bloom?.lines || []} cta="Done" onClose={() => navigate("/home", { replace: true })} />
    </Page>
  );
}
