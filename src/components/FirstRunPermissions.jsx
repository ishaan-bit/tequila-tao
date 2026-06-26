// src/components/FirstRunPermissions.jsx — the one-time, first-run consent
// screen for the two things that need the user's say-so before they help:
//   • Reminders & nudges (a device notification permission) — recommended ON.
//   • Cloud backup & sync (anonymous, no account) — offered, OFF by default.
//
// Shown exactly once, the moment someone first lands in the app proper
// (onboarded && !permsAsked), on BOTH web and native. The OS permission prompt
// fires on "Continue" — a real user gesture — only for the things left enabled.
// Both choices are fully reversible in Settings, which the copy makes explicit.
import { useState } from "react";
import { motion } from "framer-motion";
import { useProfile } from "../app/hooks.js";
import { updateProfile, updateSettings, getState } from "../app/store.js";
import { requestNotifPermission, syncReminder } from "../app/notifications.js";
import { enableSync } from "../app/cloud.js";
import { useReducedMotion } from "../app/motion.js";
import { Button } from "./ui.jsx";
import { IconBadge } from "./ui.jsx";
import { BellIcon, CloudIcon } from "./icons.jsx";

function Toggle({ checked, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`shrink-0 w-[3.25rem] h-8 rounded-full p-1 border transition-colors duration-200 ${
        checked ? "bg-jade border-jade shadow-[0_4px_12px_-4px_rgba(94,201,138,0.6)]" : "bg-white/15 border-white/30"
      }`}
    >
      <span
        className={`block h-6 w-6 rounded-full transition-transform duration-200 ${checked ? "translate-x-5 bg-ink" : "bg-pearl"}`}
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
      />
    </button>
  );
}

function Row({ icon, tone, title, sub, checked, onChange }) {
  return (
    <div className="glass rounded-2xl p-4 flex items-start gap-3.5">
      <IconBadge tone={tone}>{icon}</IconBadge>
      <div className="flex-1 min-w-0">
        <div className="text-pearl font-medium">{title}</div>
        <p className="text-sm text-pearl-faint mt-0.5">{sub}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

export default function FirstRunPermissions() {
  const profile = useProfile();
  const reduced = useReducedMotion();
  const [notif, setNotif] = useState(true); // recommended on
  const [backup, setBackup] = useState(false); // offered, off by default
  const [busy, setBusy] = useState(false);

  if (!profile.onboarded || profile.permsAsked) return null;

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Reminders: record the choice, then ask the OS only if they kept it on.
      updateSettings({ dailyReminder: notif, drinkLimitNudge: notif });
      if (notif) {
        await requestNotifPermission(); // contextual prompt on this tap
        await syncReminder(getState().settings, { request: false });
      }
      // Backup: anonymous cloud sync; the recovery code waits in Settings.
      if (backup) {
        try {
          await enableSync();
        } catch {
          /* best-effort; user can retry in Settings */
        }
      }
    } finally {
      updateProfile({ permsAsked: true });
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto"
      style={{ background: "radial-gradient(130% 90% at 50% -20%, rgba(60,80,150,0.32), transparent 60%), #0b0e1a" }}
    >
      <motion.div
        className="min-h-screen-safe flex flex-col px-safe"
        initial={reduced ? false : { opacity: 0 }}
        animate={reduced ? {} : { opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center py-10 pt-safe">
          <header className="text-center mb-6">
            <h1 className="font-display text-[1.8rem] text-pearl leading-tight">A couple of quick choices</h1>
            <p className="text-sm text-pearl-soft mt-1.5">Both are optional, and you can change either one anytime in Settings.</p>
          </header>

          <div className="space-y-3">
            <Row
              icon={<BellIcon />}
              tone="focus"
              title="Reminders & nudges"
              sub="A gentle daily check-in reminder, plus a heads-up on likely nights out. On-device, no account."
              checked={notif}
              onChange={setNotif}
            />
            <Row
              icon={<CloudIcon />}
              tone="jade"
              title="Cloud backup & sync"
              sub="Keep your progress safe and restore it on a new phone — anonymous, no name, email, or login."
              checked={backup}
              onChange={setBackup}
            />
          </div>

          <p className="text-xs text-pearl-faint text-center mt-5 px-2">
            Turning reminders on asks your device for notification permission. Nothing leaves your phone unless you switch on backup.
          </p>

          <div className="mt-6 pb-safe">
            <Button variant="primary" full disabled={busy} onClick={finish}>
              {busy ? "Setting up…" : "Continue"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
