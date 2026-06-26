// src/app/reminders.js — PURE reminder logic (no platform / Capacitor / DOM
// calls). Keeping the "when does it fire and what does it say" rules here makes
// them unit-testable and lets every surface share one source of truth: the
// native scheduler, the web Notification-Triggers scheduler, the in-app
// foreground catch-up, AND the Sendoff drink-limit heads-up.
//
// Two reminders live here:
//   • Daily check-in reminder — once a day at the user's chosen time.
//   • Drink-limit nudge — a sparse, gentle heads-up on the likely going-out
//     evenings only (Thu/Fri/Sat). Deliberately NOT nightly, so it can never
//     become a daily drinking cue (the app hides drinking imagery from
//     abstinence users for the same reason).

// Stable notification ids so re-scheduling REPLACES rather than stacks copies.
export const REMINDER_IDS = { checkin: 1001, nudgeThu: 1002, nudgeFri: 1003, nudgeSat: 1004 };

// JS Date.getDay(): 0=Sun … 6=Sat → Thursday, Friday, Saturday.
export const NUDGE_WEEKDAYS = [4, 5, 6];
// Early evening — before a typical night out, so the plan reminder lands first.
export const NUDGE_HM = "19:00";

/** Parse "HH:MM" → {hour, minute}, clamped, with a calm 21:00 default. */
export function parseHM(hm) {
  const [hRaw, mRaw] = String(hm ?? "").split(":");
  const h = parseInt(hRaw, 10);
  const m = parseInt(mRaw, 10);
  return {
    hour: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 21,
    minute: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
  };
}

/**
 * The next `count` local timestamps for a given "HH:MM", starting after `from`.
 * Optionally restrict to certain weekdays (JS getDay numbers). Used to seed the
 * web Notification-Triggers schedule, which can't express "repeat daily/weekly".
 */
export function nextOccurrences(hm, count, { weekdays = null, from = Date.now() } = {}) {
  const { hour, minute } = parseHM(hm);
  const out = [];
  const d = new Date(from);
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= from) d.setDate(d.getDate() + 1); // today's slot already passed
  let guard = 0;
  while (out.length < count && guard < 400) {
    guard++;
    if (!weekdays || weekdays.includes(d.getDay())) out.push(d.getTime());
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/**
 * Is a daily check-in reminder due *right now* (for the foreground catch-up on
 * browsers without background scheduling)? True when reminders are on, the
 * chosen time has passed today, and the user hasn't already engaged today (a
 * mood check-in or a logged drink/clear decision both count as "showed up").
 */
export function checkinDue(stats, settings, now = Date.now()) {
  if (!settings || settings.dailyReminder === false) return false;
  if (!stats) return false;
  if (stats.moodToday != null || stats.decidedToday) return false;
  const { hour, minute } = parseHM(settings.reminderTime);
  const due = new Date(now);
  due.setHours(hour, minute, 0, 0);
  return now >= due.getTime();
}

/** Is the drink-limit nudge due now — i.e. a going-out evening, past 7pm? */
export function nudgeDueNow(settings, now = Date.now()) {
  if (!settings || settings.drinkLimitNudge === false) return false;
  const d = new Date(now);
  if (!NUDGE_WEEKDAYS.includes(d.getDay())) return false;
  const { hour, minute } = parseHM(NUDGE_HM);
  const due = new Date(now);
  due.setHours(hour, minute, 0, 0);
  return now >= due.getTime();
}

// ---------- copy (goal-adaptive) ----------

export function checkinReminder() {
  return {
    title: "Tequila Tao",
    body: "A quiet minute for tonight — check in when you're ready.",
  };
}

/**
 * The evening nudge. For abstinence goals (quit/break) there is no "limit", so
 * it's reframed as a stay-the-course note with zero drinking-cue language. For
 * cutback it gently restates the user's own limit and if-then plan.
 */
export function nudgeReminder(profile) {
  const intent = profile?.intent || "cutback";
  if (intent === "quit" || intent === "break") {
    return {
      title: "You've got tonight",
      body: "Evenings are the hard part — and you're choosing clarity. Your run is worth protecting. 🌙",
    };
  }
  const limit = Number(profile?.typicalSession) || 3;
  const plan = (profile?.intention?.plan || "").trim();
  const body = plan
    ? `Out tonight? Your plan: ${plan}. Keeping it near ${limit} is a win.`
    : `Out tonight? Keeping it near ${limit} ${limit === 1 ? "drink" : "drinks"} is a win — pace yourself and hydrate.`;
  return { title: "A gentle heads-up", body };
}

/**
 * In-flow drink-limit heads-up for the Sendoff logger. Returns a short, kind,
 * non-shaming line when the count being logged is above the user's usual limit,
 * or null when there's nothing to say (nudge off, abstinence, at/under limit).
 */
export function limitNudge(drinks, profile, settings) {
  if (!settings || settings.drinkLimitNudge === false) return null;
  if ((profile?.intent || "cutback") !== "cutback") return null; // abstinence is framed elsewhere
  const n = Number(drinks);
  const limit = Number(profile?.typicalSession) || 3;
  if (!Number.isFinite(n) || n <= limit) return null;
  return `That's above your usual ${limit}. No judgment — just a heads-up. Water between rounds and a glass before bed help a lot.`;
}
