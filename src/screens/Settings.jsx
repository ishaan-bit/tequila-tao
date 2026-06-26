// src/screens/Settings.jsx — control, privacy, data ownership. (Shell route.)
// Rebuilt around the shared modern primitives: titled Sections with leading
// icon-badges, a Segmented goal switcher, and icon-badge ListRows in place of
// the old bare "Label →" text links.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile, useSettings, useStats, useStore } from "../app/hooks.js";
import {
  updateProfile,
  updateSettings,
  setGoal,
  exportData,
  importData,
  softResetStreak,
  clearAll,
  isPersistent,
} from "../app/store.js";
import { GOALS, BREAK_PRESETS, goalConfig } from "../app/selectors.js";
import { money } from "../app/format.js";
import { useCloud, enableSync, disableSync, enablePush, disablePush, restoreByCode, deleteCloud } from "../app/cloud.js";
import { syncReminder, remindersSupported } from "../app/notifications.js";
import { APP_VERSION } from "../app/version.js";
import { Button, Slider, Stepper, Chip, Sheet, Section, Segmented, ListRow, SwitchTrack } from "../components/ui.jsx";
import { Toast } from "../components/Feedback.jsx";
import {
  TargetIcon, SlidersIcon, BellIcon, SparkleIcon, DatabaseIcon, HeartIcon,
  BookIcon, InfoIcon, ShieldIcon, DocIcon, DownloadIcon, UploadIcon,
  ResetIcon, TrashIcon, ReplayIcon, InstallIcon, CloudIcon, CheckIcon,
} from "../components/icons.jsx";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AUD", "CAD"];

function Toggle({ checked, onChange, label, hint }) {
  return (
    <button onClick={() => onChange(!checked)} className="w-full flex items-center justify-between gap-3 py-2 min-h-touch" role="switch" aria-checked={checked} aria-label={label}>
      <span className="text-left">
        <span className="block text-pearl">{label}</span>
        {hint && <span className="block text-xs text-pearl-faint">{hint}</span>}
      </span>
      <SwitchTrack checked={checked} />
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const profile = useProfile();
  const settings = useSettings();
  const s = useStats();
  const store = useStore();
  const [toast, setToast] = useState("");
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [pendingImport, setPendingImport] = useState(null); // parsed backup awaiting a Replace/Merge choice
  const fileRef = useRef(null);
  const [installEvt, setInstallEvt] = useState(null);

  const flash = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2000);
  };

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const doExport = () => {
    try {
      const data = exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const d = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `tequila-tao-balance-${d}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      flash("Backup saved to your device.");
    } catch {
      flash("Couldn't export right now.");
    }
  };

  const doImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result));
        if (!obj || obj.app !== "tequila-tao") throw new Error("bad");
        if ((store.events || []).length > 0) {
          // There's data on this device — ask before overwriting vs combining.
          setPendingImport(obj);
        } else {
          importData(obj, { mode: "replace" });
          flash("Backup restored.");
        }
      } catch {
        flash("That file didn't look like a backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const applyImport = (mode) => {
    try {
      importData(pendingImport, { mode });
      flash(mode === "replace" ? "Backup restored." : "Backup merged in.");
    } catch (err) {
      flash(err?.message || "Couldn't restore that backup.");
    }
    setPendingImport(null);
  };

  // ---- daily reminder (on-device, everyone) ----
  const setReminder = (patch) => {
    const next = updateSettings(patch);
    syncReminder(next, { request: true }); // (re)schedule on native + web; prompt if needed
  };

  // ---- opt-in cloud backup & sync ----
  const cloud = useCloud();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreCode, setRestoreCode] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [confirmCloudDelete, setConfirmCloudDelete] = useState(false);

  const toggleSync = async (on) => {
    if (on) {
      try {
        await enableSync();
        flash("Cloud backup on — save your recovery code below.");
      } catch {
        flash("Couldn't turn on backup right now.");
      }
    } else {
      disableSync();
      flash("Cloud backup off. Your remote backup is kept so you can restore.");
    }
  };

  const togglePush = async (on) => {
    if (on) {
      try {
        const r = await enablePush();
        flash(r?.native ? "Notifications on — native setup finishing." : "Notifications on.");
      } catch (e) {
        flash(e?.message || "Couldn't enable notifications.");
      }
    } else {
      disablePush();
      flash("Notifications off.");
    }
  };

  const doRestore = async () => {
    if (!restoreCode.trim()) return;
    setRestoring(true);
    try {
      await restoreByCode(restoreCode, (store.events || []).length ? "merge" : "replace");
      flash("Restored from your backup.");
      setRestoreOpen(false);
      setRestoreCode("");
    } catch (e) {
      flash(e?.message || "Couldn't restore that code.");
    } finally {
      setRestoring(false);
    }
  };

  const doCloudDelete = async () => {
    await deleteCloud();
    setConfirmCloudDelete(false);
    flash("Cloud backup deleted.");
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(cloud.recoveryCode || "");
      flash("Recovery code copied.");
    } catch {
      flash("Copy failed — write it down instead.");
    }
  };

  const goalOptions = Object.values(GOALS).map((g) => ({ value: g.id, label: g.label }));

  return (
    <div className="pt-3 pb-6 space-y-4">
      <header className="text-center mb-1">
        <h1 className="font-display text-[1.7rem] text-pearl leading-tight">Settings</h1>
        <p className="text-sm text-pearl-faint mt-0.5">Your goal, your numbers, your data.</p>
      </header>

      {!isPersistent() && (
        <div className="rounded-2xl p-3.5 text-sm flex items-start gap-2.5" style={{ background: "rgba(200,116,42,0.12)", border: "1px solid rgba(200,116,42,0.4)" }}>
          <span aria-hidden className="text-amber mt-0.5">⚠</span>
          <span className="text-pearl-soft">Your browser is blocking on-device storage (private mode?). Progress won't be saved between visits — export a backup to keep it.</span>
        </div>
      )}

      <Section title="Your goal" icon={<TargetIcon />} tone="jade">
        <Segmented ariaLabel="Your goal" options={goalOptions} value={profile.intent} onChange={(id) => { setGoal(id); flash(`Goal set: ${GOALS[id].label}.`); }} />
        <p className="text-xs text-pearl-faint">
          {goalConfig(profile).sub}. Switching restarts your day count — that's okay, many people change goals over time.
        </p>

        {profile.intent === "cutback" && (
          <div className="pt-1">
            <Slider
              id="target"
              label={`Goal: alcohol-free on ${Math.round(profile.targetYinRatio * 100)}% of nights`}
              value={Math.round(profile.targetYinRatio * 100)}
              min={50}
              max={95}
              onChange={(v) => updateProfile({ targetYinRatio: v / 100 })}
            />
          </div>
        )}

        {profile.intent === "break" && (
          <div className="space-y-2.5 pt-1">
            <div className="text-sm text-pearl-soft">
              {s.breakComplete ? (
                <>Break complete 🌿 — start another below.</>
              ) : (
                <>
                  Day <span className="tnum text-pearl">{Math.min(s.breakElapsed, s.breakLen)}</span> of{" "}
                  <span className="tnum text-pearl">{s.breakLen}</span> · {s.breakDaysLeft} to go
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {BREAK_PRESETS.map((d) => (
                <Chip key={d} selected={profile.breakDays === d} onClick={() => updateProfile({ breakDays: d })}>
                  {d} days
                </Chip>
              ))}
            </div>
            <button
              onClick={() => {
                setGoal("break", { breakDays: profile.breakDays });
                flash("Break restarted from today.");
              }}
              className="text-sm text-focus underline underline-offset-4 hover:text-pearl min-h-touch"
            >
              Restart the countdown from today
            </button>
          </div>
        )}

        {profile.intent === "quit" && (
          <div className="rounded-2xl p-3.5 text-sm text-pearl-soft" style={{ background: "rgba(94,201,138,0.08)", border: "1px solid rgba(94,201,138,0.22)" }}>
            Goal: <span className="text-jade font-medium">100% alcohol-free</span> — the app counts your days and protects every one. A slip is a lapse, not the end.
          </div>
        )}
      </Section>

      <Section title="Your numbers" icon={<SlidersIcon />} tone="moonstone">
        <Slider id="dpw" label={`Baseline: ${profile.drinksPerWeekBaseline} drinks/week`} value={profile.drinksPerWeekBaseline} min={0} max={30} onChange={(v) => updateProfile({ drinksPerWeekBaseline: v })} />
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-pearl-soft">Typical drinks per night</span>
          <Stepper value={profile.typicalSession} min={1} max={15} label="typical session" onChange={(v) => updateProfile({ typicalSession: v })} />
        </div>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-pearl-soft">Currency</span>
          <span className="relative">
            <select value={profile.currency} onChange={(e) => updateProfile({ currency: e.target.value })} className="raised rounded-xl pl-3 pr-9 py-2.5 text-sm text-pearl font-medium">
              {CURRENCIES.map((c) => (
                <option key={c} value={c} style={{ background: "#141a2e", color: "#f4f1e8" }}>
                  {c}
                </option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-pearl-faint text-xs">▾</span>
          </span>
        </label>
        <label className="block">
          <span className="text-sm text-pearl-soft">{money(10000, profile.currency)} saved means…</span>
          <input value={profile.rewardGoal?.label || ""} onChange={(e) => updateProfile({ rewardGoal: { ...profile.rewardGoal, label: e.target.value } })} className="mt-2 w-full bg-black/20 border border-white/12 rounded-2xl px-4 min-h-touch text-pearl placeholder:text-pearl-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-focus" placeholder="a weekend away" />
        </label>
      </Section>

      <Section title="Reminders" icon={<BellIcon />} tone="focus">
        <Toggle checked={settings.dailyReminder !== false} onChange={(v) => setReminder({ dailyReminder: v })} label="Daily check-in reminder" hint="A gentle nudge to check in each day" />
        <label className={`flex items-center justify-between gap-3 ${settings.dailyReminder === false ? "opacity-50" : ""}`}>
          <span className="text-sm text-pearl-soft">Reminder time</span>
          <input type="time" value={settings.reminderTime} disabled={settings.dailyReminder === false} onChange={(e) => setReminder({ reminderTime: e.target.value })} className="raised rounded-xl px-3 py-2 text-sm text-pearl [color-scheme:dark]" />
        </label>
        <div className="hairline" />
        <Toggle checked={settings.drinkLimitNudge !== false} onChange={(v) => setReminder({ drinkLimitNudge: v })} label="Drink-limit nudge" hint="A gentle heads-up on likely nights out (Thu–Sat)" />
        <p className="text-xs text-pearl-faint">
          {remindersSupported()
            ? "Reminders run on this device — no account needed. The installed app delivers them most reliably."
            : "This browser can't show reminders. Install the app to get them."}
        </p>
      </Section>

      <Section title="Feel & motion" icon={<SparkleIcon />} tone="gold">
        <Toggle checked={settings.sound} onChange={(v) => updateSettings({ sound: v })} label="Ambient sounds" hint="Soft cues on wins (off by default)" />
        <div className="hairline" />
        <Toggle checked={settings.haptics} onChange={(v) => updateSettings({ haptics: v })} label="Haptics" hint="Gentle taps (where supported)" />
        <div className="hairline" />
        <Toggle checked={settings.reducedMotionOverride} onChange={(v) => updateSettings({ reducedMotionOverride: v })} label="Reduce motion" hint="Calms the breathing & transitions" />
      </Section>

      <Section title="Your data" icon={<DatabaseIcon />} tone="moonstone">
        <p className="text-sm text-pearl-soft">Everything lives on this device. Take it or wipe it any time.</p>
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="glass" onClick={doExport}>
            <DownloadIcon size={16} /> Export
          </Button>
          <Button variant="glass" onClick={() => fileRef.current?.click()}>
            <UploadIcon size={16} /> Import
          </Button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={doImport} className="hidden" />
        <ListRow
          icon={<ResetIcon />}
          tone="amber"
          title="Soft-reset streak"
          sub="Start the count over — keeps all lifetime totals"
          trailing={null}
          onClick={() => { softResetStreak(); flash("Streak restarted — totals kept."); }}
        />
        {!confirmWipe ? (
          <ListRow
            icon={<TrashIcon />}
            danger
            title="Clear everything…"
            sub="Erase all progress on this device"
            trailing={null}
            onClick={() => setConfirmWipe(true)}
          />
        ) : (
          <div className="rounded-2xl p-4" style={{ background: "rgba(122,15,43,0.18)", border: "1px solid rgba(122,15,43,0.5)" }}>
            <p className="text-sm text-pearl">Erase all progress permanently? This can't be undone — export a backup first if you're unsure.</p>
            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <Button variant="glass" onClick={() => setConfirmWipe(false)}>Keep it</Button>
              <Button variant="wine" onClick={() => { clearAll(); setConfirmWipe(false); flash("Cleared. A fresh start."); navigate("/"); }}>Erase all</Button>
            </div>
          </div>
        )}
      </Section>

      <Section title="Backup & sync" icon={<CloudIcon />} tone="focus">
        <p className="text-sm text-pearl-soft">
          Back up your progress and restore it on a new phone — anonymously, with no name, email, or login. Turn it off anytime.{" "}
          <button onClick={() => navigate("/privacy")} className="text-focus underline underline-offset-2">What's stored</button>.
        </p>
        <Toggle
          checked={cloud.sync}
          onChange={toggleSync}
          label="Back up to the cloud"
          hint={cloud.sync && cloud.lastSync ? `Last backed up ${new Date(cloud.lastSync).toLocaleString()}` : "Anonymous; encrypted in transit"}
        />

        {cloud.sync && cloud.recoveryCode && (
          <div className="rounded-2xl p-4" style={{ background: "rgba(127,179,255,0.1)", border: "1px solid rgba(127,179,255,0.3)" }}>
            <div className="text-[11px] uppercase tracking-wider text-pearl-soft">Your recovery code</div>
            <div className="font-mono text-lg text-pearl tracking-wider mt-1 break-all">{cloud.recoveryCode}</div>
            <p className="text-xs text-pearl-faint mt-1.5">Save this — it's the only way to restore on another device, and anyone with it can read your backup.</p>
            <Button variant="glass" className="mt-2.5" onClick={copyCode}><CheckIcon size={15} /> Copy code</Button>
          </div>
        )}

        <div className="hairline" />
        <Toggle checked={cloud.push} onChange={togglePush} label="Notifications" hint="Supportive nudges we can send you" />

        <div className="hairline" />
        <ListRow icon={<UploadIcon />} tone="moonstone" title="Restore from a recovery code" sub="Bring a backup to this device" trailing={null} onClick={() => setRestoreOpen(true)} />

        {cloud.sync &&
          (!confirmCloudDelete ? (
            <ListRow icon={<TrashIcon />} danger title="Delete cloud backup" sub="Remove your data from our servers" trailing={null} onClick={() => setConfirmCloudDelete(true)} />
          ) : (
            <div className="rounded-2xl p-4" style={{ background: "rgba(122,15,43,0.18)", border: "1px solid rgba(122,15,43,0.5)" }}>
              <p className="text-sm text-pearl">Delete your cloud backup? Your on-device data stays — only the cloud copy is removed.</p>
              <div className="grid grid-cols-2 gap-2.5 mt-3">
                <Button variant="glass" onClick={() => setConfirmCloudDelete(false)}>Keep it</Button>
                <Button variant="wine" onClick={doCloudDelete}>Delete</Button>
              </div>
            </div>
          ))}
      </Section>

      {installEvt && (
        <Button variant="primary" full onClick={async () => { installEvt.prompt(); setInstallEvt(null); }}>
          <InstallIcon size={18} /> Install as an app
        </Button>
      )}

      <Section title="About & care" icon={<HeartIcon />} tone="wine">
        <div className="space-y-2">
          <ListRow icon={<BookIcon />} tone="moonstone" title="How it works" onClick={() => navigate("/guide")} />
          <ListRow icon={<InfoIcon />} tone="focus" title="About" onClick={() => navigate("/about")} />
          <ListRow icon={<ShieldIcon />} tone="jade" title="Privacy" onClick={() => navigate("/privacy")} />
          <ListRow icon={<DocIcon />} tone="amber" title="Terms & care" onClick={() => navigate("/terms")} />
          <ListRow
            icon={<ReplayIcon />}
            tone="teal"
            title="Replay the intro guide"
            sub="A quick how-to"
            onClick={() => { updateProfile({ tourSeen: false }); navigate("/home"); }}
          />
        </div>
        <p className="text-xs text-pearl-faint text-center pt-2">Tequila Tao v{APP_VERSION} · made with care, not for sale</p>
      </Section>

      <Sheet open={restoreOpen} onClose={() => setRestoreOpen(false)} title="Restore from a code">
        <p className="text-sm text-pearl-soft">Enter the recovery code from your other device, and we'll bring that backup here.</p>
        <input
          value={restoreCode}
          onChange={(e) => setRestoreCode(e.target.value)}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="mt-3 w-full glass rounded-2xl px-4 min-h-touch text-pearl font-mono tracking-wider placeholder:text-pearl-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
        <div className="grid grid-cols-1 gap-2.5 mt-4">
          <Button variant="primary" full disabled={restoring || !restoreCode.trim()} onClick={doRestore}>
            {restoring ? "Restoring…" : "Restore my data"}
          </Button>
          <Button variant="ghost" full onClick={() => setRestoreOpen(false)}>Cancel</Button>
        </div>
      </Sheet>

      <Sheet open={!!pendingImport} onClose={() => setPendingImport(null)} title="Restore backup">
        <p className="text-sm text-pearl-soft">
          You already have data on this device. Replace it with the backup, or merge the two together?
        </p>
        <div className="grid grid-cols-1 gap-2.5 mt-4">
          <Button variant="primary" full onClick={() => applyImport("replace")}>
            Replace everything with the backup
          </Button>
          <Button variant="glass" full onClick={() => applyImport("merge")}>
            Merge (keep both, no duplicates)
          </Button>
          <Button variant="ghost" full onClick={() => setPendingImport(null)}>
            Cancel
          </Button>
        </div>
      </Sheet>

      <Toast show={!!toast}>{toast}</Toast>
    </div>
  );
}
