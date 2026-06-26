// src/screens/Progress.jsx — the long-game surface, rebuilt around a real
// month calendar instead of a legend-gated heatmap. The order follows what
// recovery actually needs: continuity first, then pattern recognition (the
// calendar), then reflections, then earned progress — with the finance-style
// totals kept as progressive disclosure so a day-1 user never meets a wall of
// empty metric cards. (Shell route.)
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useProfile, useStats, useStore, useCards } from "../app/hooks.js";
import { buildDays, dayLabel } from "../app/selectors.js";
import { currentMonth, shiftMonth, compareMonth, firstActivityMonth } from "../app/calendar.js";
import { money, moneyEquivalents, currencySymbol } from "../app/format.js";
import { useReducedMotion } from "../app/motion.js";
import { Counter, Sparkline, MOODS, Sheet, IconBadge } from "../components/ui.jsx";
import { StatusLegend } from "../components/status.jsx";
import MonthCalendar from "../components/MonthCalendar.jsx";
import DayDetail from "../components/DayDetail.jsx";
import { SproutIcon, LeafIcon, TreeIcon, MountainIcon, StarIcon, TrophyIcon, MedalIcon, WalletIcon } from "../components/icons.jsx";

const STREAK_ICON = { 3: SproutIcon, 7: LeafIcon, 14: TreeIcon, 30: MountainIcon, 60: StarIcon, 100: TrophyIcon };
function MilestoneGlyph({ c }) {
  const key = String(c.key || "");
  if (c.kind === "money" || /money/.test(key)) return <WalletIcon size={22} />;
  const n = c.n ?? Number(key.match(/(\d+)n/)?.[1]);
  const Ico = STREAK_ICON[n] || MedalIcon;
  return <Ico size={22} />;
}

export default function Progress() {
  const navigate = useNavigate();
  const profile = useProfile();
  const s = useStats();
  const state = useStore();
  const cards = useCards();
  const reduced = useReducedMotion();

  const now = Date.now();
  const daysMap = useMemo(() => buildDays(state.events || [], now), [state.events, now]);
  const [month, setMonth] = useState(() => currentMonth(now));
  const [sel, setSel] = useState(null); // selected day cell

  const cur = currentMonth(now);
  const first = firstActivityMonth(state.events || [], now);
  const canPrev = compareMonth(month, first) > 0;
  const canNext = compareMonth(month, cur) < 0;
  const goPrev = () => canPrev && setMonth((m) => shiftMonth(m.year, m.monthIndex, -1));
  const goNext = () => canNext && setMonth((m) => shiftMonth(m.year, m.monthIndex, 1));

  const onLog = (path, dayKey) => {
    setSel(null);
    navigate(path, { state: { forDay: dayKey } });
  };

  // Continuity headline — the single most important thing on this screen.
  const continuity = s.isAbstinence
    ? { big: s.soberDays, unit: s.soberDays === 1 ? "day alcohol-free" : "days alcohol-free", best: s.bestSoberRun }
    : { big: s.currentClearStreak, unit: s.currentClearStreak === 1 ? "alcohol-free night in a row" : "alcohol-free nights in a row", best: s.bestClearStreak };

  // Mood reflections.
  const moodPts = s.clarityTrend.filter((d) => d.mood != null);
  const latestMood = moodPts.length ? MOODS.find((m) => m.v === moodPts[moodPts.length - 1].mood) : null;
  const moodSummary =
    moodPts.length < 2 ? "Not enough check-ins yet to show a trend." : `Mood over ${moodPts.length} days; most recently ${latestMood?.label || "logged"}.`;

  // Cravings proof (only once it has earned its place).
  const urges = (state.events || []).filter((e) => e.type === "urge_surf" && e.payload?.outcome === "made_it");
  const avgDrop = urges.length > 0 ? (urges.reduce((a, e) => a + (Number(e.payload.before) - Number(e.payload.after)), 0) / urges.length).toFixed(1) : null;

  // Progressive disclosure: the finance-style totals only appear once there's
  // something real to show. Until then a warm, forward-looking panel instead.
  const meaningful = s.clearNights + s.drinkNights >= 3 || s.moneyKept > 0 || s.urgesSurfed > 0;
  const goalAmt = profile.rewardGoal?.amount || 10000;
  const goalPct = Math.min(100, (s.moneyKept / goalAmt) * 100);
  const equiv = moneyEquivalents(s.moneyKept, profile.currency)[0];

  return (
    <div className="pt-3 pb-4 space-y-4">
      <Reveal reduced={reduced} i={0}>
        <h1 className="font-display text-2xl text-pearl text-center">Your progress</h1>
      </Reveal>

      {/* 1 — continuity, front and centre */}
      <Reveal reduced={reduced} i={1}>
        <div className="glass-strong rounded-3xl p-6 text-center relative overflow-hidden">
          <span aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #5ec98a 30%, #5ec98a 70%, transparent)", opacity: 0.7 }} />
          <div className="font-display text-6xl num-hero tnum leading-none">
            <Counter value={continuity.big} />
          </div>
          <div className="text-pearl-soft text-sm mt-2.5 uppercase tracking-[0.16em]">{continuity.unit}</div>
          {continuity.best > continuity.big && (
            <div className="text-pearl-faint text-xs mt-1">
              best so far · <span className="tnum">{continuity.best}</span> {continuity.best === 1 ? "day" : "days"}
            </div>
          )}
          {continuity.big === 0 && continuity.best > 0 && (
            <div className="text-jade text-sm mt-2">A fresh start today — your history is all still here.</div>
          )}
        </div>
      </Reveal>

      {/* 2 — the calendar: month context + tap-to-inspect */}
      <Reveal reduced={reduced} i={2}>
        <MonthCalendar
          year={month.year}
          monthIndex={month.monthIndex}
          daysMap={daysMap}
          now={now}
          selectedKey={sel?.dayKey}
          onSelectDay={setSel}
          onPrev={goPrev}
          onNext={goNext}
          canPrev={canPrev}
          canNext={canNext}
        />
        <p className="text-center text-[11px] text-pearl-faint mt-2">Tap any day for its story — or to fill in a night you missed.</p>
        <StatusLegend className="mt-2" />
      </Reveal>

      {/* 3 — reflections (mood trend) */}
      <Reveal reduced={reduced} i={3}>
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-pearl-soft">How you've been feeling</span>
            {latestMood && <span className="text-lg" aria-hidden>{latestMood.face}</span>}
          </div>
          <div className="mt-3">
            <Sparkline data={s.clarityTrend} ariaLabel={moodSummary} />
          </div>
          <p className="text-[11px] text-pearl-faint mt-2">
            {moodPts.length >= 2 ? "Last 30 days of check-ins." : "Tap a face on Home each day to grow this."}
          </p>
        </div>
      </Reveal>

      {/* 4 — earned progress (progressive disclosure) */}
      {meaningful ? (
        <>
          <Reveal reduced={reduced} i={4}>
            <div className="flex items-center justify-between mb-1 px-1">
              <h2 className="text-pearl font-medium">What you've kept</h2>
              <span className="text-[11px] text-jade rounded-full bg-jade/10 px-2.5 py-1">these never go down</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Big label="Money kept" accent="text-jade" value={<Counter value={s.moneyKept} prefix={currencySymbol(profile.currency)} />} />
              <Big label="Drinks avoided" accent="text-moonstone" value={<Counter value={s.drinksAvoided} />} />
              <Big label="Cravings beaten" accent="text-gold" value={<Counter value={s.urgesSurfed} />} />
              <Big label={s.isAbstinence ? "Longest sober run" : "Longest streak"} accent="text-pearl" value={<Counter value={s.bestPrimaryStreak} suffix=" days" />} />
            </div>
          </Reveal>

          {s.moneyKept > 0 && (
            <Reveal reduced={reduced} i={5}>
              <div className="glass rounded-3xl p-5">
                {s.moneyKept >= goalAmt ? (
                  <div className="flex items-center gap-3">
                    <IconBadge tone="gold"><TrophyIcon size={22} /></IconBadge>
                    <div className="flex-1 min-w-0">
                      <div className="text-pearl font-medium">Reward reached — {profile.rewardGoal?.label || "your goal"} 🎉</div>
                      <div className="text-sm text-pearl-soft">{money(s.moneyKept, profile.currency)} kept. Set your next goal in Settings.</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-pearl-soft">Toward {profile.rewardGoal?.label || "your reward"}</span>
                      <span className="tnum text-sm text-jade">{money(s.moneyKept, profile.currency)} / {money(goalAmt, profile.currency)}</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-black/25 overflow-hidden border border-white/5">
                      <div className="h-full rounded-full" style={{ width: `${goalPct}%`, background: "linear-gradient(180deg, #74dca0, #46b074)", boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.4)", transition: "width 0.6s ease" }} />
                    </div>
                    {equiv && <p className="text-xs text-pearl-soft mt-2">That's about {equiv}.</p>}
                  </>
                )}
              </div>
            </Reveal>
          )}

          {avgDrop != null && (
            <Reveal reduced={reduced} i={6}>
              <div className="glass rounded-3xl p-5">
                <div className="text-sm text-pearl-soft">Getting through cravings works</div>
                <p className="text-pearl mt-1">
                  On average your cravings dropped <span className="text-jade font-semibold tnum">{avgDrop} points</span> after the calming tool — proven on your own data.
                </p>
              </div>
            </Reveal>
          )}
        </>
      ) : (
        <Reveal reduced={reduced} i={4}>
          <div className="glass rounded-3xl p-5 text-center">
            <div className="text-3xl mb-1" aria-hidden>🌱</div>
            <div className="text-pearl font-medium">Your numbers grow here</div>
            <p className="text-sm text-pearl-soft mt-1">
              Money kept, drinks avoided and your longest run will fill in as you log nights. Nothing to prove yet — just keep showing up.
            </p>
          </div>
        </Reveal>
      )}

      {/* 5 — milestones (forward-looking, always) */}
      <Reveal reduced={reduced} i={7}>
        <div>
          <h2 className="text-pearl font-medium px-1 mb-2">Milestones {cards.length > 0 && <span className="text-pearl-faint text-sm">({cards.length})</span>}</h2>
          {cards.length === 0 ? (
            <div className="glass rounded-3xl p-5 text-sm text-pearl-faint text-center">
              A quiet badge marks each milestone — 3, 7, 14, 30, 60 and 100 nights, and every money goal. Known in advance, never random. Your first is just 3 alcohol-free nights away.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {cards.map((c, i) => (
                <div key={c.key + i} className="glass rounded-2xl p-4 flex flex-col items-center text-center gap-2">
                  <IconBadge tone="gold">
                    <MilestoneGlyph c={c} />
                  </IconBadge>
                  <div className="text-sm text-pearl font-medium leading-snug">{c.name}</div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-gold">Milestone</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      {/* selected-day detail */}
      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel ? dayLabel(sel.dayKey) : ""}>
        {sel && (
          <DayDetail
            day={sel}
            currency={profile.currency}
            onLog={onLog}
            onDecide={() => {
              setSel(null);
              navigate("/crossroads");
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

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
      <div className="text-[11px] uppercase tracking-wider text-pearl-soft">{label}</div>
      <div className={`text-2xl font-semibold tnum mt-0.5 ${accent}`}>{value}</div>
    </div>
  );
}
