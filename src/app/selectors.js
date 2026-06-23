// src/app/selectors.js
// Pure, derived stats over the immutable event log. Nothing here is stored as
// authoritative — that is what makes lifetime totals impossible to drift and
// impossible for a slip to erase. All "day" math is in the device's local TZ.

export const CLEAR_STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];
export const MONEY_MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000];

// ---------------------------------------------------------------------------
// Goal configuration. The onboarding "What's your goal?" choice now genuinely
// drives the whole app (it used to be captured and never read). Each goal is
// grounded in the de-addiction evidence base (cited in the Guide + docs):
//
//   • cutback → moderation / controlled drinking. The ratio-of-clear-nights
//     "balance" model with an NIAAA-style low-risk target (~80% alcohol-free
//     nights). Most problem drinkers start here; goal-choice improves
//     engagement and is revisable in Settings (people often migrate to
//     abstinence over time — Hodgins/Henssler 2021).
//   • break → time-boxed temporary abstinence, "Dry January" style. de Visser
//     (2016): even people who don't complete the month cut later consumption
//     and raise drink-refusal self-efficacy. So it's a FIXED end date with a
//     day countdown, a 100% target, and partial credit (never shaming).
//   • quit → abstinence. Marlatt's relapse-prevention model: a lapse is not a
//     relapse, and the guilt of the Abstinence Violation Effect is what turns a
//     slip into a fall — so the no-shame framing is clinically protective, not
//     just kind. Headline metric = continuous days alcohol-free; 100% target.
//
// `metric` selects the home-screen headline; `abstinence` flips the nightly
// tone (clear-night balance vs. a sober-day streak that any drink resets).
export const GOALS = {
  cutback: {
    id: "cutback",
    label: "Cut back",
    sub: "Drink less, on purpose",
    abstinence: false,
    metric: "balance", // headline = yin/yang balance %
    defaultTarget: 0.8,
    breakDays: null,
  },
  break: {
    id: "break",
    label: "Take a break",
    sub: "A clean stretch, then reassess",
    abstinence: true,
    metric: "countdown", // headline = day X of Y, days to go
    defaultTarget: 1,
    breakDays: 30,
  },
  quit: {
    id: "quit",
    label: "Quit",
    sub: "Step away for good",
    abstinence: true,
    metric: "sober", // headline = continuous days alcohol-free
    defaultTarget: 1,
    breakDays: null,
  },
};

export const BREAK_PRESETS = [7, 14, 30, 60, 90];

export function goalConfig(profile) {
  return GOALS[profile?.intent] || GOALS.cutback;
}

// Plain progression labels (was the cryptic Sprout/Stream/Grove/Mountain/Still
// Lake — nobody could tell what those meant or how to rank up).
export const LEVELS = [
  { title: "Starting out", at: 0 },
  { title: "Building", at: 100 },
  { title: "Steady", at: 300 },
  { title: "Strong", at: 700 },
  { title: "Rock solid", at: 1500 },
];

// Transparent balance weights (shown verbatim in the app's "how this is
// calculated" accordion — keep these in sync with the Guide copy).
export const YIN_WEIGHTS = { clear_night: 3, urge_surf: 1, soft_landing: 1 };
export const YANG_PER_DRINK = 1;

const DAY_MS = 86400000;

// Honest *starting* balance, computed from the onboarding inputs. A typical week
// is 7 nights; about baseline/typicalSession of them are drinking nights, the
// rest are clear. We seed BOTH sides with the SAME weights as the live economy
// (clear night = +3 yin, each drink = +1 yang) so a brand-new user starts from
// their real rhythm — never a fake 50/50, never a hollow 0%. As real events
// accumulate they quickly outweigh this one-week seed.
export function baselineSeed(profile) {
  const baseline = Math.max(0, num(profile?.drinksPerWeekBaseline));
  const session = Math.max(1, num(profile?.typicalSession) || 1);
  const nightsOut = clamp(Math.round(baseline / session), 0, 7);
  const clearPerWeek = 7 - nightsOut;
  return {
    baseline,
    nightsOut,
    clearPerWeek,
    yinSeed: clearPerWeek * YIN_WEIGHTS.clear_night,
    yangSeed: baseline * YANG_PER_DRINK,
  };
}

// The yin% a fresh profile starts at, before any events are logged.
export function startingYinPct(profile) {
  const { yinSeed, yangSeed } = baselineSeed(profile);
  const d = yinSeed + yangSeed;
  return d <= 0 ? 50 : clamp((yinSeed / d) * 100, 0, 100);
}

export function localDayKey(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dayKeyOffset(offsetDays, from = Date.now()) {
  return localDayKey(from - offsetDays * DAY_MS);
}

function startOfWeekTs(now = Date.now()) {
  return now - 7 * DAY_MS;
}

// Build a per-day rollup of outcomes from the event log.
function buildDays(events) {
  const days = new Map(); // dayKey -> outcome
  for (const e of events) {
    const k = localDayKey(e.ts);
    const o =
      days.get(k) ||
      { clear: false, drinkUnfrozen: false, drinkFrozen: false, reset: false, any: false, mood: null };
    o.any = true;
    if (e.type === "clear_night") o.clear = true;
    else if (e.type === "drink_night") {
      if (e.payload?.frozen) o.drinkFrozen = true;
      else o.drinkUnfrozen = true;
    } else if (e.type === "streak_reset") o.reset = true;
    if (e.type === "mood_checkin" || e.type === "soft_landing") {
      const m = e.payload?.mood;
      if (typeof m === "number") o.mood = m; // last of the day wins
    }
    days.set(k, o);
  }
  return days;
}

// Inclusive list of day keys from `fromTs` to today (local days).
function dayRange(fromTs, toTs = Date.now()) {
  const out = [];
  let cursor = new Date(fromTs);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(toTs);
  end.setHours(0, 0, 0, 0);
  // guard against pathological ranges
  let guard = 0;
  while (cursor <= end && guard < 4000) {
    out.push(localDayKey(cursor.getTime()));
    cursor = new Date(cursor.getTime() + DAY_MS);
    guard++;
  }
  return out;
}

export function computeStats(state) {
  const { events = [], profile } = state;
  const now = Date.now();
  const todayKey = localDayKey(now);
  const days = buildDays(events);

  // ---- sums / counts over the whole log (monotonic by construction) ----
  let clearNights = 0;
  let drinkNights = 0;
  let totalDrinks = 0;
  let moneyKept = 0;
  let moneyKeptThisMonth = 0;
  let drinksAvoided = 0;
  let urgesSurfed = 0;
  let softLandings = 0;
  let moodCheckins = 0;
  let frozenThisWeek = 0;
  const monthKey = todayKey.slice(0, 7);
  const weekStart = startOfWeekTs(now);

  for (const e of events) {
    const p = e.payload || {};
    switch (e.type) {
      case "clear_night":
        clearNights++;
        moneyKept += num(p.moneySaved);
        drinksAvoided += num(p.drinksAvoided);
        if (localDayKey(e.ts).slice(0, 7) === monthKey) moneyKeptThisMonth += num(p.moneySaved);
        break;
      case "drink_night":
        drinkNights++;
        totalDrinks += num(p.drinks);
        if (p.frozen && e.ts >= weekStart) frozenThisWeek++;
        break;
      case "urge_surf":
        if (p.outcome === "made_it") urgesSurfed++;
        break;
      case "soft_landing":
        softLandings++;
        break;
      case "mood_checkin":
        moodCheckins++;
        break;
      default:
        break;
    }
  }

  // ---- streaks ----
  const firstTs = events.length ? Math.min(...events.map((e) => e.ts)) : now;
  const allDays = events.length ? dayRange(firstTs, now) : [];

  // Clear-night streak. Walk back from today over the current no-drink run:
  //   • a clear_night (or a freeze) GROWS the streak
  //   • an unfrozen drink or explicit reset BREAKS it (pauses to 0)
  //   • eventless / other days simply BRIDGE (neither grow nor break)
  // This is kind (a missed day won't reset you) AND credible (only real clear
  // nights count, so an unused app accrues nothing and milestones stay earned),
  // and it makes "log a clear night → +1" exactly honest.
  let currentClearStreak = 0;
  for (let i = allDays.length - 1; i >= 0; i--) {
    const o = days.get(allDays[i]);
    if (o && (o.drinkUnfrozen || o.reset)) break;
    if (o && (o.clear || o.drinkFrozen)) currentClearStreak++;
  }

  // best ever clear streak (same rules across all history).
  let bestClearStreak = 0;
  let run = 0;
  for (const k of allDays) {
    const o = days.get(k);
    if (o && (o.drinkUnfrozen || o.reset)) run = 0;
    else if (o && (o.clear || o.drinkFrozen)) {
      run++;
      if (run > bestClearStreak) bestClearStreak = run;
    }
  }
  bestClearStreak = Math.max(bestClearStreak, currentClearStreak);

  // check-in streak: consecutive days (ending today or yesterday) with any event.
  let checkinStreak = 0;
  {
    let i = allDays.length - 1;
    // allow today to be empty without zeroing
    if (i >= 0 && allDays[i] === todayKey && !(days.get(todayKey)?.any)) i--;
    for (; i >= 0; i--) {
      if (days.get(allDays[i])?.any) checkinStreak++;
      else break;
    }
  }

  // ---- sober run (for 'break' and 'quit' abstinence goals) ----
  // Unlike the clear-night streak (which counts only *logged* clear nights), the
  // sober run counts EVERY day without a drink — for an abstinence goal, simply
  // not drinking is the win, no nightly logging required. It is anchored to the
  // goal start so a fresh quitter reads "Day 1" right away, and ANY drink (a
  // "frozen"/planned one included) resets it: there is no protected drink when
  // the goal is to stay off it entirely.
  const goal = GOALS[profile?.intent] || GOALS.cutback;
  const goalStartTs = num(profile?.goalStart) || firstTs;
  const hasJourney = events.length > 0 || !!profile?.goalStart;
  const journeyDays = hasJourney ? dayRange(Math.min(goalStartTs, firstTs), now) : [];
  let currentSoberRun = 0;
  for (let i = journeyDays.length - 1; i >= 0; i--) {
    const o = days.get(journeyDays[i]);
    if (o && (o.drinkUnfrozen || o.drinkFrozen)) break;
    currentSoberRun++;
  }
  let bestSoberRun = 0;
  {
    let sr = 0;
    for (const k of journeyDays) {
      const o = days.get(k);
      if (o && (o.drinkUnfrozen || o.drinkFrozen)) sr = 0;
      else {
        sr++;
        if (sr > bestSoberRun) bestSoberRun = sr;
      }
    }
    bestSoberRun = Math.max(bestSoberRun, currentSoberRun);
  }

  // Time-boxed break: a FIXED calendar countdown from the goal start, so the end
  // date never moves even if a day gets slipped (partial credit, never reset).
  const breakLen = Math.max(1, num(profile?.breakDays) || GOALS.break.breakDays);
  const breakElapsed = goal.metric === "countdown" && hasJourney ? dayRange(goalStartTs, now).length : 0;
  const breakDaysLeft = Math.max(0, breakLen - breakElapsed);
  const breakComplete = goal.metric === "countdown" && breakElapsed >= breakLen;
  const breakProgressPct = clamp((breakElapsed / breakLen) * 100, 0, 100);

  const isAbstinence = goal.abstinence;
  const primaryStreak = isAbstinence ? currentSoberRun : currentClearStreak;
  const bestPrimaryStreak = isAbstinence ? bestSoberRun : bestClearStreak;

  // EARNED cleanliness for the abstinence circle. The bug: a fresh quitter showed
  // a full (100%) circle on day one — unearned, and inconsistent with what cutback
  // honestly shows. Fix: start at the SAME realistic baseline cutback would show
  // (startingYinPct, from your inputs), then climb to a full clear circle as sober
  // days accumulate toward a horizon (the break length, or 100 days for an
  // open-ended quit). A slip pulls it back toward — but never below — the baseline
  // (never-shaming). So: day 1 ≈ baseline, sustained sobriety ⇒ a genuinely full
  // circle that was earned, and switching modes no longer jumps to a fake 100%.
  const cleanHorizon = goal.metric === "countdown" ? breakLen : 100;
  const baselineYin = startingYinPct(profile);
  const soberProgress = clamp(currentSoberRun / cleanHorizon, 0, 1);
  const cleanPct = clamp(baselineYin + (100 - baselineYin) * soberProgress, 0, 100);

  // ---- balance (yin / yang) ----
  const yinPoints =
    clearNights * YIN_WEIGHTS.clear_night +
    urgesSurfed * YIN_WEIGHTS.urge_surf +
    softLandings * YIN_WEIGHTS.soft_landing;
  const yangPoints = totalDrinks * YANG_PER_DRINK;
  // Seed BOTH sides from the honest baseline week (see baselineSeed) so a new
  // user starts from their real rhythm, not a fake 50/50 and not a hollow 0%.
  const { yinSeed, yangSeed } = baselineSeed(profile);
  const denom = yinPoints + yinSeed + yangPoints + yangSeed;
  const yinFrac = denom <= 0 ? 0.5 : (yinPoints + yinSeed) / denom;
  const yinPct = clamp(yinFrac * 100, 0, 100);
  // The number the circle actually renders: the moderation balance for cutback,
  // honest cleanliness for abstinence goals (so it can fill all the way).
  const displayYinPct = isAbstinence ? cleanPct : yinPct;
  // Abstinence goals (break/quit) aim at the rim — allow the target up to 100%.
  const targetPct = clamp((profile?.targetYinRatio ?? goal.defaultTarget) * 100, 50, 100);

  // ---- clarity points / level ----
  const clarityPoints =
    clearNights * 10 + softLandings * 15 + urgesSurfed * 20 + drinkNights * 5 + moodCheckins * 5;
  let level = LEVELS[0];
  let levelIndex = 0;
  LEVELS.forEach((l, i) => {
    if (clarityPoints >= l.at) {
      level = l;
      levelIndex = i;
    }
  });
  const nextLevel = LEVELS[levelIndex + 1] || null;

  // ---- milestones / patina ----
  // Patina grows with the goal's PRIMARY streak: logged clear nights for cutback,
  // continuous sober days for break/quit — so a quitter's ring ages by sobriety.
  const reachedClearMilestones = CLEAR_STREAK_MILESTONES.filter((m) => bestPrimaryStreak >= m);
  const reachedMoneyMilestones = MONEY_MILESTONES.filter((m) => moneyKept >= m);
  const patinaSegments = reachedClearMilestones.length;
  const patinaTotal = CLEAR_STREAK_MILESTONES.length;

  // ---- trends ----
  const clarityTrend = [];
  for (let i = 29; i >= 0; i--) {
    const k = dayKeyOffset(i, now);
    clarityTrend.push({ day: k, mood: days.get(k)?.mood ?? null });
  }
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const k = dayKeyOffset(i, now);
    const o = days.get(k);
    let status = "none";
    if (o?.drinkUnfrozen) status = "drank";
    else if (o?.clear) status = "clear";
    else if (o?.any) status = "rest";
    last7.push({ day: k, status, checkedIn: !!o?.any });
  }

  const moodToday = days.get(todayKey)?.mood ?? null;
  const drankToday = !!days.get(todayKey)?.drinkUnfrozen;
  const clearToday = !!days.get(todayKey)?.clear;

  const freezesRemaining = Math.max(0, 2 - frozenThisWeek);

  return {
    // streaks
    currentClearStreak,
    bestClearStreak,
    checkinStreak,
    // goal-aware (abstinence: continuous days alcohol-free, any drink resets)
    goalType: goal.id,
    isAbstinence,
    soberDays: currentSoberRun,
    bestSoberRun,
    cleanPct,
    displayYinPct,
    primaryStreak,
    bestPrimaryStreak,
    breakLen,
    breakElapsed,
    breakDaysLeft,
    breakComplete,
    breakProgressPct,
    // lifetime totals (monotonic)
    clearNights,
    drinkNights,
    totalDrinks,
    moneyKept,
    moneyKeptThisMonth,
    drinksAvoided,
    urgesSurfed,
    softLandings,
    moodCheckins,
    // balance
    yinPct,
    yangPct: 100 - yinPct,
    targetPct,
    inZone: Math.abs(yinPct - targetPct) <= 6,
    leaning: yinPct >= targetPct - 6 ? "clear" : yinPct >= 45 ? "centered" : "warm",
    // gamification
    clarityPoints,
    level,
    levelIndex,
    nextLevel,
    reachedClearMilestones,
    reachedMoneyMilestones,
    patinaSegments,
    patinaTotal,
    // trends
    clarityTrend,
    last7,
    moodToday,
    drankToday,
    clearToday,
    // freezes
    freezesRemaining,
    frozenThisWeek,
  };
}

// ---- helpers ----
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
export function clamp(x, a, b) {
  return Math.min(b, Math.max(a, x));
}

// Day-rollup heatmap for the Clarity Garden (most recent `days` days).
export function heatmap(state, dayCount = 84) {
  const days = buildDays(state.events || []);
  const out = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const k = dayKeyOffset(i);
    const o = days.get(k);
    let status = "none";
    if (o?.drinkUnfrozen) status = "drank";
    else if (o?.clear) status = "clear";
    else if (o?.any) status = "rest";
    out.push({ day: k, status, mood: o?.mood ?? null });
  }
  return out;
}
