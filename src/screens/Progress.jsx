// src/screens/Progress.jsx — the long-game retention surface. Every motivator
// first-class and inspectable, the daily check-in rewarded with a visible mood
// trajectory, and milestones celebrated with calm, brand-coherent icons (never
// variable/loot — fixed, pre-announced thresholds). (Shell route.)
import { motion } from "framer-motion";
import { useProfile, useStats, useStore, useCards } from "../app/hooks.js";
import { heatmap, localDayKey } from "../app/selectors.js";
import { money, moneyEquivalents, currencySymbol } from "../app/format.js";
import { useReducedMotion } from "../app/motion.js";
import { Counter, Sparkline, MOODS } from "../components/ui.jsx";
import { StatusLegend, STATUS } from "../components/status.jsx";

const TILE = {
  clear: "var(--color-jade)",
  frozen: "var(--color-moonstone)", // protected / planned night (its own state now)
  drank: "var(--color-slate)", // neutral grey, never red
  rest: "var(--color-sage)", // grey-blue "checked in"
  none: "rgba(244,241,232,0.06)",
};

// Calm, fixed per-milestone icons — a quiet sense of seasons passing, not loot.
const STREAK_ICON = { 3: "🌱", 7: "🌿", 14: "🌳", 30: "⛰️", 60: "🌠", 100: "🏔️" };
function milestoneIcon(c) {
  const key = String(c.key || "");
  if (c.kind === "money" || /money/.test(key)) return "💰";
  const n = c.n ?? Number(key.match(/(\d+)n/)?.[1]);
  return STREAK_ICON[n] || "🏅";
}

export default function Progress() {
  const profile = useProfile();
  const s = useStats();
  const state = useStore();
  const cards = useCards();
  const reduced = useReducedMotion();
  const cells = heatmap(state, 84);
  const todayKey = localDayKey(Date.now());

  const urges = (state.events || []).filter((e) => e.type === "urge_surf" && e.payload?.outcome === "made_it");
  const avgDrop =
    urges.length > 0
      ? (urges.reduce((a, e) => a + (Number(e.payload.before) - Number(e.payload.after)), 0) / urges.length).toFixed(1)
      : null;

  const goalAmt = profile.rewardGoal?.amount || 10000;
  const goalPct = Math.min(100, (s.moneyKept / goalAmt) * 100);
  const equiv = moneyEquivalents(s.moneyKept, profile.currency)[0];

  // Mood trend (rewards the daily check-in) + a real text alternative.
  const moodPts = s.clarityTrend.filter((d) => d.mood != null);
  const latestMood = moodPts.length ? MOODS.find((m) => m.v === moodPts[moodPts.length - 1].mood) : null;
  const moodSummary =
    moodPts.length < 2
      ? "Not enough check-ins yet to show a trend."
      : `Mood over ${moodPts.length} days; most recently ${latestMood?.label || "logged"}.`;

  return (
    <div className="pt-3 pb-4">
      <Reveal reduced={reduced} i={0}>
        <h1 className="font-display text-2xl text-pearl text-center mb-1">Your progress</h1>
        <p className="text-center text-xs text-pearl-faint mb-4">Your last 12 weeks. Each square is a night.</p>
      </Reveal>

      {/* heatmap */}
      <Reveal reduced={reduced} i={1}>
        <div className="glass rounded-3xl p-4" role="img" aria-label={`Last 12 weeks of nights. ${s.clearNights} alcohol-free, ${s.drinkNights} with a drink.`}>
          <div className="grid gap-1.5 justify-center" style={{ gridTemplateRows: "repeat(7, minmax(0,1fr))", gridAutoFlow: "column" }}>
            {cells.map((c) => {
              const isToday = c.day === todayKey;
              return (
                <div
                  key={c.day}
                  title={`${c.day} · ${STATUS[c.status]?.label || c.status}`}
                  className="h-3.5 w-3.5 rounded-[4px]"
                  style={{
                    background: TILE[c.status],
                    outline: isToday ? "1.5px solid var(--color-focus)" : "none",
                    outlineOffset: "1px",
                  }}
                />
              );
            })}
          </div>
          <StatusLegend className="mt-3" />
        </div>
      </Reveal>

      {/* mood trend */}
      <Reveal reduced={reduced} i={2}>
        <div className="glass rounded-3xl p-5 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-pearl-soft">How you've been feeling</span>
            {latestMood && <span className="text-lg" aria-hidden>{latestMood.face}</span>}
          </div>
          <div className="mt-3">
            <Sparkline data={s.clarityTrend} ariaLabel={moodSummary} />
          </div>
          <p className="text-[11px] text-pearl-faint mt-2">{moodPts.length >= 2 ? "Last 30 days of check-ins." : "Tap a face on Home each day to grow this."}</p>
        </div>
      </Reveal>

      {/* lifetime totals */}
      <Reveal reduced={reduced} i={3}>
        <div className="flex items-center justify-between mt-4 mb-2 px-1">
          <h2 className="text-pearl font-medium">Lifetime</h2>
          <span className="text-[11px] text-jade rounded-full bg-jade/10 px-2.5 py-1">these never go down</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Big label="Money kept" accent="text-jade" value={<Counter value={s.moneyKept} prefix={currencySymbol(profile.currency)} />} />
          <Big label="Drinks avoided" accent="text-moonstone" value={<Counter value={s.drinksAvoided} />} />
          <Big label="Cravings beaten" accent="text-jade" value={<Counter value={s.urgesSurfed} />} />
          <Big label={s.isAbstinence ? "Longest sober run" : "Longest streak"} accent="text-pearl" value={<Counter value={s.bestPrimaryStreak} suffix=" days" />} />
        </div>
      </Reveal>

      {/* money goal thermometer */}
      <Reveal reduced={reduced} i={4}>
        <div className="glass rounded-3xl p-5 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-pearl-soft">Toward {profile.rewardGoal?.label || "your reward"}</span>
            <span className="tnum text-sm text-jade">{money(s.moneyKept, profile.currency)} / {money(goalAmt, profile.currency)}</span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${goalPct}%`, background: "var(--color-jade)", transition: "width 0.6s ease" }} />
          </div>
          {equiv && <p className="text-xs text-pearl-faint mt-2">That's about {equiv}. 😌</p>}
        </div>
      </Reveal>

      {/* urge proof */}
      {avgDrop != null && (
        <Reveal reduced={reduced} i={5}>
          <div className="glass rounded-3xl p-5 mt-3">
            <div className="text-sm text-pearl-soft">Getting through cravings works</div>
            <p className="text-pearl mt-1">
              On average your cravings dropped <span className="text-jade font-semibold tnum">{avgDrop} points</span> after you used the calming tool — proven on your own data.
            </p>
          </div>
        </Reveal>
      )}

      {/* milestone badges */}
      <Reveal reduced={reduced} i={6}>
        <div className="mt-4">
          <h2 className="text-pearl font-medium px-1 mb-2">Milestone badges {cards.length > 0 && <span className="text-pearl-faint text-sm">({cards.length})</span>}</h2>
          {cards.length === 0 ? (
            <div className="glass rounded-3xl p-5 text-sm text-pearl-faint text-center">
              Earn a badge each time you hit a milestone — at 3, 7, 14, 30, 60 and 100 nights, and at each money goal. Known in advance, never random. Your first unlocks at 3 alcohol-free nights.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {cards.map((c, i) => (
                <div key={c.key + i} className="glass rounded-2xl p-4 text-center">
                  <div className="text-3xl mb-1" aria-hidden>{milestoneIcon(c)}</div>
                  <div className="text-sm text-pearl font-medium">{c.name}</div>
                  <div className="text-[11px] uppercase tracking-wider text-gold mt-1">Milestone</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}

// Calm, reduced-motion-safe staggered reveal.
function Reveal({ children, i = 0, reduced, className }) {
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3), ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Big({ label, value, accent }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[11px] uppercase tracking-wider text-pearl-faint">{label}</div>
      <div className={`text-2xl font-semibold tnum mt-0.5 ${accent}`}>{value}</div>
    </div>
  );
}
