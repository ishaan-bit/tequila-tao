// src/app/notifications.js — local daily reminders.
//
// This is on-device only: it schedules a repeating local notification through
// Capacitor, so it works for EVERYONE in the installed app with no account, no
// server, and no cloud opt-in. (Remote push — sent from the ops console — is a
// separate, opt-in thing; see cloud.js.) On the web it's a no-op, because
// browsers can't reliably schedule a local notification for a future time.
import { Capacitor } from "@capacitor/core";

// A fixed id so re-scheduling REPLACES the reminder instead of stacking copies.
const REMINDER_ID = 1001;

export function remindersSupported() {
  return Capacitor.isNativePlatform();
}

function parseHM(hm) {
  const [h, m] = String(hm || "21:00").split(":").map((n) => parseInt(n, 10));
  return {
    hour: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 21,
    minute: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
  };
}

/**
 * Schedule (or reschedule) the daily check-in reminder from the user's settings.
 * Call on app launch and whenever the reminder time / toggle changes. Returns a
 * small status object (handy for surfacing "couldn't get permission" in the UI).
 *
 * settings: { reminderTime: "HH:MM", dailyReminder: boolean }
 */
export async function syncReminder(settings) {
  if (!Capacitor.isNativePlatform()) return { scheduled: false, reason: "web" };
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    // Always clear the old one first so a time change doesn't leave a duplicate.
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });

    if (settings?.dailyReminder === false) return { scheduled: false, reason: "off" };

    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") return { scheduled: false, reason: "denied" };

    const { hour, minute } = parseHM(settings?.reminderTime);
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_ID,
          title: "Tequila Tao",
          body: "A quiet minute for tonight — check in when you're ready.",
          // `on` (without a full date) fires daily at this hour:minute.
          schedule: { on: { hour, minute }, allowWhileIdle: true },
        },
      ],
    });
    return { scheduled: true, hour, minute };
  } catch (e) {
    return { scheduled: false, reason: e?.message || "error" };
  }
}

export async function cancelReminder() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
  } catch {
    /* ignore */
  }
}
