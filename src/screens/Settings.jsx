// src/screens/Settings.jsx — control, privacy, data ownership. (Shell route.)
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
import { Button, Slider, Stepper, Chip, Sheet } from "../components/ui.jsx";
import { Toast } from "../components/Feedback.jsx";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AUD", "CAD"];
const APP_VERSION = "3.0.0";

function Toggle({ checked, onChange, label, hint }) {
  return (
    <button onClick={() => onChange(!checked)} className="w-full flex items-center justify-between gap-3 py-2.5 min-h-touch" role="switch" aria-checked={checked} aria-label={label}>
      <span className="text-left">
        <span className="block text-pearl">{label}</span>
        {hint && <span className="block text-xs text-pearl-faint">{hint}</span>}
      </span>
      {/* knob is dark on the jade track (on) and light on the dark track (off):
          high contrast in BOTH states — never black-on-black. */}
      <span className={`shrink-0 w-12 h-7 rounded-full p-1 border transition-colors ${checked ? "bg-jade border-jade" : "bg-white/25 border-white/40"}`}>
        <span
          className={`block h-5 w-5 rounded-full transition-transform ${checked ? "translate-x-5 bg-ink" : "bg-pearl"}`}
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
        />
      </span>
    </button>
  );
}

function Section({ title, children }) {
  return (
    <section className="glass rounded-3xl p-5 space-y-3">
      <h2 className="font-display text-lg text-pearl">{title}</h2>
      {children}
    </section>
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

  return (
    <div className="pt-3 pb-6 space-y-4">
      <h1 className="font-display text-2xl text-pearl text-center mb-1">Settings</h1>

      {!isPersistent() && (
        <div className="rounded-2xl p-3 text-sm" style={{ background: "rgba(200,116,42,0.12)", border: "1px solid rgba(200,116,42,0.4)" }}>
          Your browser is blocking on-device storage (private mode?). Progress won't be saved between visits — export a backup to keep it.
        </div>
      )}

      <Section title="Your goal">
        <div className="grid grid-cols-3 gap-2">
          {Object.values(GOALS).map((g) => (
            <Chip
              key={g.id}
              selected={profile.intent === g.id}
              className="w-full px-2"
              onClick={() => {
                if (profile.intent === g.id) return; // re-tapping your goal shouldn't wipe the count
                setGoal(g.id);
                flash(`Goal set: ${g.label}.`);
              }}
            >
              {g.label}
            </Chip>
          ))}
        </div>
        <p className="text-xs text-pearl-faint">
          {goalConfig(profile).sub}. Switching restarts your day count — that's okay, many people change goals over time.
        </p>

        {profile.intent === "cutback" && (
          <Slider
            id="target"
            label={`Goal: alcohol-free on ${Math.round(profile.targetYinRatio * 100)}% of nights`}
            value={Math.round(profile.targetYinRatio * 100)}
            min={50}
            max={95}
            onChange={(v) => updateProfile({ targetYinRatio: v / 100 })}
          />
        )}

        {profile.intent === "break" && (
          <div className="space-y-2.5">
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
              className="text-sm text-pearl-soft underline underline-offset-4 hover:text-pearl min-h-touch"
            >
              Restart the countdown from today
            </button>
          </div>
        )}

        {profile.intent === "quit" && (
          <div className="glass rounded-2xl p-3 text-sm text-pearl-soft">
            Goal: <span className="text-jade">100% alcohol-free</span> — the app counts your days and protects every one. A slip is a lapse, not the end.
          </div>
        )}
      </Section>

      <Section title="Your numbers">
        <Slider id="dpw" label={`Baseline: ${profile.drinksPerWeekBaseline} drinks/week`} value={profile.drinksPerWeekBaseline} min={0} max={30} onChange={(v) => updateProfile({ drinksPerWeekBaseline: v })} />
        <div className="flex items-center justify-between">
          <span className="text-sm text-pearl-soft">Typical drinks per night</span>
          <Stepper value={profile.typicalSession} min={1} max={15} label="typical session" onChange={(v) => updateProfile({ typicalSession: v })} />
        </div>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-pearl-soft">Currency</span>
          <span className="relative">
            <select value={profile.currency} onChange={(e) => updateProfile({ currency: e.target.value })} className="glass rounded-xl pl-3 pr-8 py-2 text-sm text-pearl">
              {CURRENCIES.map((c) => (
                <option key={c} value={c} style={{ background: "#141a2e", color: "#f4f1e8" }}>
                  {c}
                </option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-pearl-faint text-xs">▾</span>
          </span>
        </label>
        <label className="block">
          <span className="text-sm text-pearl-soft">{money(10000, profile.currency)} saved means…</span>
          <input value={profile.rewardGoal?.label || ""} onChange={(e) => updateProfile({ rewardGoal: { ...profile.rewardGoal, label: e.target.value } })} className="mt-2 w-full glass rounded-2xl px-4 min-h-touch text-pearl focus:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
        </label>
      </Section>

      <Section title="Reminders">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-pearl-soft">Daily check-in time</span>
          <input type="time" value={settings.reminderTime} onChange={(e) => updateSettings({ reminderTime: e.target.value })} className="glass rounded-xl px-3 py-2 text-sm text-pearl [color-scheme:dark]" />
        </label>
        <Toggle checked={settings.drinkLimitNudge} onChange={(v) => updateSettings({ drinkLimitNudge: v })} label="Drink-limit nudge" hint="A gentle reminder on nights out (in the app build)" />
        <p className="text-xs text-pearl-faint">Notifications activate in the installed app. On the web they're saved for later.</p>
      </Section>

      <Section title="Feel & motion">
        <Toggle checked={settings.sound} onChange={(v) => updateSettings({ sound: v })} label="Ambient sounds" hint="Soft cues on wins (off by default)" />
        <Toggle checked={settings.haptics} onChange={(v) => updateSettings({ haptics: v })} label="Haptics" hint="Gentle taps (where supported)" />
        <Toggle checked={settings.reducedMotionOverride} onChange={(v) => updateSettings({ reducedMotionOverride: v })} label="Reduce motion" hint="Calms the breathing & transitions" />
      </Section>

      <Section title="Your data">
        <p className="text-sm text-pearl-soft">Everything lives on this device. Take it or wipe it any time.</p>
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="glass" onClick={doExport}>
            <DownloadIcon /> Export backup
          </Button>
          <Button variant="glass" onClick={() => fileRef.current?.click()}>
            <UploadIcon /> Import backup
          </Button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={doImport} className="hidden" />
        <button onClick={() => { softResetStreak(); flash("Streak restarted — totals kept."); }} className="w-full text-left text-sm text-pearl-soft py-2.5 hover:text-pearl min-h-touch">
          Soft-reset streak <span className="text-pearl-faint">(keeps all lifetime totals)</span>
        </button>
        {!confirmWipe ? (
          <button onClick={() => setConfirmWipe(true)} className="w-full text-left text-sm py-2.5 text-pearl-soft hover:text-pearl min-h-touch">
            Clear everything…
          </button>
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

      {installEvt && (
        <Button variant="primary" full onClick={async () => { installEvt.prompt(); setInstallEvt(null); }}>
          Install as an app
        </Button>
      )}

      <Section title="About & care">
        <div className="grid grid-cols-2 gap-2">
          <NavRow label="How it works" onClick={() => navigate("/guide")} />
          <NavRow label="About" onClick={() => navigate("/about")} />
          <NavRow label="Privacy" onClick={() => navigate("/privacy")} />
          <NavRow label="Terms & care" onClick={() => navigate("/terms")} />
        </div>
        <button
          onClick={() => {
            updateProfile({ tourSeen: false });
            navigate("/home");
          }}
          className="w-full text-left text-sm text-pearl-soft py-2.5 hover:text-pearl min-h-touch"
        >
          Replay the intro guide <span className="text-pearl-faint">(a quick how-to)</span>
        </button>
        <p className="text-xs text-pearl-faint text-center pt-2">Tequila Tao v{APP_VERSION} · made with care, not for sale</p>
      </Section>

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

function NavRow({ label, onClick }) {
  return (
    <button onClick={onClick} className="glass rounded-2xl px-4 py-3 text-sm text-pearl-soft text-left hover:bg-white/10 min-h-touch">
      {label} →
    </button>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12M7 11l5 5 5-5M5 21h14" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21V9M7 13l5-5 5 5M5 3h14" />
    </svg>
  );
}
