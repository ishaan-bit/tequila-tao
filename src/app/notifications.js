// src/app/notifications.js — local reminders & nudges, working on BOTH the
// native (Android/AAB) shell and the web app. There are two reminders, both
// on-device and account-free (see reminders.js for the pure rules + copy):
//   • Daily check-in reminder — once a day at the user's chosen time.
//   • Drink-limit nudge — a sparse evening heads-up on Thu/Fri/Sat.
//
// Delivery per platform:
//   • Native  → @capacitor/local-notifications schedules real repeating OS
//               notifications (daily + weekly), firing even when the app is shut.
//   • Web     → if the browser supports Notification Triggers (installed
//               Chromium PWAs), we schedule real background notifications too.
//               Every other browser falls back to a foreground "catch-up": when
//               the app is opened past a due reminder, we post it then. So the
//               reminder is never silently dropped on the web.
//
// This module NEVER prompts for permission on its own unless asked to
// (`{ request: true }`). The first-run consent screen and the Settings toggles
// own the moment of asking; launch-time (re)scheduling stays silent.
import { Capacitor } from "@capacitor/core";
import { getState } from "./store.js";
import { computeStats, localDayKey } from "./selectors.js";
import {
  REMINDER_IDS,
  NUDGE_WEEKDAYS,
  NUDGE_HM,
  parseHM,
  nextOccurrences,
  checkinDue,
  nudgeDueNow,
  checkinReminder,
  nudgeReminder,
} from "./reminders.js";

const isNative = () => Capacitor.isNativePlatform();
const hasWebNotif = () => typeof Notification !== "undefined" && typeof navigator !== "undefined" && "serviceWorker" in navigator;

/** True wherever reminders can run at all (native always; web with Notification + SW). */
export function remindersSupported() {
  return isNative() || hasWebNotif();
}

/** Background scheduling on the web (installed Chromium PWAs) — progressive only. */
function triggersSupported() {
  return (
    hasWebNotif() &&
    typeof window !== "undefined" &&
    "showTrigger" in Notification.prototype &&
    "TimestampTrigger" in window
  );
}

// ---------- permission ----------

/** Current notification permission: 'granted' | 'denied' | 'prompt'/'default' | 'unsupported'. */
export async function notifPermission() {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      return (await LocalNotifications.checkPermissions()).display;
    } catch {
      return "unsupported";
    }
  }
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

/** Ask for notification permission. Returns true iff granted. */
export async function requestNotifPermission() {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      return (await LocalNotifications.requestPermissions()).display === "granted";
    } catch {
      return false;
    }
  }
  if (typeof Notification === "undefined") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

// ---------- scheduling ----------

/**
 * (Re)schedule both reminders from the current settings. Call on launch and
 * whenever a reminder setting changes. Pass `{ request: true }` from a user
 * action (consent screen / Settings toggle) to prompt for permission if needed;
 * launch calls leave it false so nobody is prompted out of nowhere.
 */
export async function syncReminder(settings, { request = false } = {}) {
  const profile = getState().profile;
  try {
    if (isNative()) {
      if (request) {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        await LocalNotifications.requestPermissions();
      }
      return await syncNative(settings, profile);
    }
    if (!hasWebNotif()) return { scheduled: false, reason: "unsupported" };
    if (request && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    return await syncWeb(settings, profile);
  } catch (e) {
    return { scheduled: false, reason: e?.message || "error" };
  }
}

async function syncNative(settings, profile) {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  // Clear all of ours first so a time/toggle change never leaves duplicates.
  await LocalNotifications.cancel({ notifications: Object.values(REMINDER_IDS).map((id) => ({ id })) });

  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") return { scheduled: false, reason: "denied" };

  const toSchedule = [];

  if (settings?.dailyReminder !== false) {
    const { hour, minute } = parseHM(settings?.reminderTime);
    const c = checkinReminder(profile);
    // `on` without a date repeats daily at this hour:minute.
    toSchedule.push({ id: REMINDER_IDS.checkin, title: c.title, body: c.body, schedule: { on: { hour, minute }, allowWhileIdle: true } });
  }

  if (settings?.drinkLimitNudge !== false) {
    const { hour, minute } = parseHM(NUDGE_HM);
    const n = nudgeReminder(profile);
    // Capacitor weekday is 1=Sunday … 7=Saturday, so JS getDay + 1. `on` with a
    // weekday repeats weekly. Thu/Fri/Sat → three weekly schedules.
    const idByDay = { 4: REMINDER_IDS.nudgeThu, 5: REMINDER_IDS.nudgeFri, 6: REMINDER_IDS.nudgeSat };
    NUDGE_WEEKDAYS.forEach((jsDay) => {
      toSchedule.push({ id: idByDay[jsDay], title: n.title, body: n.body, schedule: { on: { weekday: jsDay + 1, hour, minute }, allowWhileIdle: true } });
    });
  }

  if (toSchedule.length) await LocalNotifications.schedule({ notifications: toSchedule });
  return { scheduled: toSchedule.length > 0, count: toSchedule.length, native: true };
}

const WEB_TAG = "tt-rem-";

async function clearWebPending(reg) {
  try {
    const existing = await reg.getNotifications({ includeTriggered: true });
    existing.forEach((nf) => {
      if (String(nf.tag || "").startsWith(WEB_TAG)) nf.close();
    });
  } catch {
    /* getNotifications options vary by browser — best effort */
  }
}

async function syncWeb(settings, profile) {
  if (Notification.permission !== "granted") return { scheduled: false, reason: "web-perm" };
  // Without Triggers we can't pre-schedule background notifications; the
  // foreground catch-up (runWebCatchup) is what covers those browsers.
  if (!triggersSupported()) return { scheduled: false, reason: "web-foreground-only" };

  const reg = await navigator.serviceWorker.ready;
  await clearWebPending(reg);

  if (settings?.dailyReminder !== false) {
    const c = checkinReminder(profile);
    nextOccurrences(settings?.reminderTime, 14).forEach((ts, i) => {
      reg.showNotification(c.title, { body: c.body, tag: `${WEB_TAG}checkin-${i}`, showTrigger: new window.TimestampTrigger(ts), data: { kind: "checkin" } });
    });
  }
  if (settings?.drinkLimitNudge !== false) {
    const n = nudgeReminder(profile);
    nextOccurrences(NUDGE_HM, 6, { weekdays: NUDGE_WEEKDAYS }).forEach((ts, i) => {
      reg.showNotification(n.title, { body: n.body, tag: `${WEB_TAG}nudge-${i}`, showTrigger: new window.TimestampTrigger(ts), data: { kind: "nudge" } });
    });
  }
  return { scheduled: true, web: true };
}

/** Turn every reminder off (used if both toggles go off / on full reset). */
export async function cancelReminder() {
  try {
    if (isNative()) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.cancel({ notifications: Object.values(REMINDER_IDS).map((id) => ({ id })) });
      return;
    }
    if (!hasWebNotif()) return;
    await clearWebPending(await navigator.serviceWorker.ready);
  } catch {
    /* ignore */
  }
}

// ---------- web foreground catch-up ----------
// On browsers without Triggers, this is how a due reminder still reaches the
// user: when they open (or re-focus) the app past a due time and haven't been
// reminded today, we post the notification now. Deduped per local day so it
// never fires twice for the same day.
const SEEN_KEY = "tt_reminder_seen_v1";
function readSeen() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function markSeen(kind, dayKey) {
  const s = readSeen();
  s[kind] = dayKey;
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(s));
  } catch {
    /* ignore (private mode) */
  }
}

export async function runWebCatchup(now = Date.now()) {
  if (isNative() || !hasWebNotif()) return;
  if (Notification.permission !== "granted") return;
  // Triggers-capable browsers already get real background notifications; running
  // the catch-up too would double up, so leave it to them.
  if (triggersSupported()) return;

  const state = getState();
  if (!state.profile?.onboarded) return;
  const { settings, profile } = state;
  const stats = computeStats(state);
  const dk = localDayKey(now);
  const seen = readSeen();

  const reg = await navigator.serviceWorker.ready.catch(() => null);
  const post = (title, body, kind) => {
    try {
      if (reg) reg.showNotification(title, { body, tag: `${WEB_TAG}${kind}`, data: { kind } });
      else new Notification(title, { body, tag: `${WEB_TAG}${kind}` });
    } catch {
      /* ignore */
    }
    markSeen(kind, dk);
  };

  if (seen.checkin !== dk && checkinDue(stats, settings, now)) {
    const c = checkinReminder(profile);
    post(c.title, c.body, "checkin");
  }
  if (seen.nudge !== dk && nudgeDueNow(settings, now)) {
    const n = nudgeReminder(profile);
    post(n.title, n.body, "nudge");
  }
}
