// src/screens/Progress.jsx — Clarity Garden: long-game retention surface.
// Every motivator first-class and inspectable. (Shell route.)
import { useProfile, useStats, useStore, useCards } from "../app/hooks.js";
import { heatmap } from "../app/selectors.js";
import { money, moneyEquivalents, currencySymbol } from "../app/format.js";
import { Counter } from "../components/ui.jsx";

const TILE = {
  clear: "var(--color-jade)", // the one "clear/positive" green (was teal — a 2nd green)
  drank: "var(--color-slate)", // neutral grey, never red
  rest: "var(--color-sage)", // grey-blue "checked in" (no longer a 3rd green)
  none: "rgba(244,241,232,0.06)",
};

export default function Progress() {
  const profile = useProfile();
  const s = useStats();
  const state = useStore();
  const cards = useCards();
  const cells = heatmap(state, 84);

  const urges = (state.events || []).filter((e) => e.type === "urge_surf" && e.payload?.outcome === "made_it");
  const avgDrop =
    urges.length > 0
      ? (urges.reduce((a, e) => a + (Number(e.payload.before) - Number(e.payload.after)), 0) / urges.length).toFixed(1)
      : null;

  const goalAmt = profile.rewardGoal?.amount || 10000;
  const goalPct = Math.min(100, (s.moneyKept / goalAmt) * 100);
  const equiv = moneyEquivalents(s.moneyKept, profile.currency)[0];

  return (
    <div className="pt-3 pb-4">
      <h1 className="font-display text-2xl text-pearl text-center mb-1">Your progress</h1>
      <p className="text-center text-xs text-pearl-faint mb-4">Your last 12 weeks. Green squares are alcohol-free nights.</p>

      {/* heatmap */}
      <div className="glass rounded-3xl p-4">
        <div className="grid gap-1.5 justify-center" style={{ gridTemplateRows: "repeat(7, minmax(0,1fr))", gridAutoFlow: "column" }}>
          {cells.map((c) => (
            <div
              key={c.day}
              title={`${c.day} · ${c.status}`}
              className="h-3.5 w-3.5 rounded-[4px]"
              style={{ background: TILE[c.status] }}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-pearl-faint">
          <Legend color={TILE.clear} label="alcohol-free" />
          <Legend color={TILE.rest} label="checked in" />
          <Legend color={TILE.drank} label="drank" />
        </div>
      </div>

      {/* lifetime totals */}
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

      {/* money goal thermometer */}
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

      {/* urge proof */}
      {avgDrop != null && (
        <div className="glass rounded-3xl p-5 mt-3">
          <div className="text-sm text-pearl-soft">Getting through cravings works</div>
          <p className="text-pearl mt-1">
            On average your cravings dropped <span className="text-jade font-semibold tnum">{avgDrop} points</span> after you used the calming tool — proven on your own data.
          </p>
        </div>
      )}

      {/* clarity cards */}
      <div className="mt-4">
        <h2 className="text-pearl font-medium px-1 mb-2">Milestone badges {cards.length > 0 && <span className="text-pearl-faint text-sm">({cards.length})</span>}</h2>
        {cards.length === 0 ? (
          <div className="glass rounded-3xl p-5 text-sm text-pearl-faint text-center">
            Earn a badge each time you hit a milestone. Your first one unlocks at 3 alcohol-free nights.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {cards.map((c, i) => (
              <div key={c.key + i} className="glass rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">🃏</div>
                <div className="text-sm text-pearl font-medium">{c.name}</div>
                <div className="text-[11px] uppercase tracking-wider text-gold mt-1">{c.rarity}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-[4px]" style={{ background: color }} /> {label}
    </span>
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
