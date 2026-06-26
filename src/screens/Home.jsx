// src/screens/Home.jsx — the daily recovery companion. Read top to bottom it's a
// short narrative: orientation (date + where you are) → today's ONE choice →
// support that's always a tap away → gentle continuity. Everything but the
// primary action and the craving net is deliberately quiet, so the screen never
// asks the user to choose between several equally-loud cards.
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useProfile, useStats, useStore } from "../app/hooks.js";
import { useReducedMotion } from "../app/motion.js";
import { addEvent, removeEvent, updateProfile, setGoal } from "../app/store.js";
import { currencySymbol } from "../app/format.js";
import { YIN_WEIGHTS, YANG_PER_DRINK, baselineSeed, recentDays } from "../app/selectors.js";
import { primaryAction } from "../app/home.js";
import { success } from "../app/haptics.js";
import { play } from "../app/sound.js";
import YinYang from "../components/YinYang.jsx";
import Mascot, { quipFor } from "../components/Mascot.jsx";
import DateHeader from "../components/DateHeader.jsx";
import DailyStateCard from "../components/DailyStateCard.jsx";
import { MetricTile, MoodPicker, Counter } from "../components/ui.jsx";
import { Toast } from "../components/Feedback.jsx";
import IntroTour from "../components/IntroTour.jsx";
import DayStrip from "../components/DayStrip.jsx";

const LEAN_TEXT = {
  clear: "On track — mostly alcohol-free",
  centered: "A steady mix of nights",
  warm: "Drinking a bit more lately",
};

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useProfile();
  const s = useStats();
  const state = useStore();
  const reduced = useReducedMotion();
  const [toast, setToast] = useState("");
  const [showHow, setShowHow] = useState(false);
  const [undo, setUndo] = useState(null);
  const toastTimer = useRef(0);
  const undoTimer = useRef(0);
  useEffect(() => () => {
    clearTimeout(toastTimer.current);
    clearTimeout(undoTimer.current);
  }, []);

  const now = Date.now();
  const hour = new Date(now).getHours();
  const days = recentDays(state, 28);
  const seed = baselineSeed(profile);
  const action = primaryAction(s, hour);

  // A flow can hand back a toast (e.g. a won craving) and/or an undoable entry.
  useEffect(() => {
    const jl = location.state?.justLogged;
    const tt = location.state?.toast;
    if (!jl && !tt) return;
    if (jl?.id) {
      setUndo(jl);
      clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setUndo(null), 6500);
    }
    if (tt) flash(tt);
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const flash = (m) => {
    setToast(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  };

  const doUndo = () => {
    if (undo?.id) {
      removeEvent(undo.id);
      success();
    }
    clearTimeout(undoTimer.current);
    setUndo(null);
  };

  const [tourDone, setTourDone] = useState(false);
  const showTour = profile.onboarded && !profile.tourSeen && !tourDone;
  const closeTour = () => {
    setTourDone(true);
    updateProfile({ tourSeen: true });
  };

  const logMood = (m) => {
    addEvent("mood_checkin", { mood: m });
    success();
    play("clear", 0.4);
    flash("Noted. Showing up counts.");
  };

  // The two nightly entries, minus whichever is already the loud primary action.
  const secondary = [
    { key: "tonight", emoji: "🌙", label: "Tonight", to: "/crossroads" },
    { key: "recover", emoji: "🌅", label: "Morning after", to: "/recover" },
  ].filter((x) => x.key !== action.kind);

  const streakVal = s.isAbstinence ? s.soberDays : s.currentClearStreak;
  const showMoodRow = s.moodToday == null && action.kind !== "checkin";
  const inComeback = s.isAbstinence ? s.soberDays === 0 && s.bestSoberRun > 0 : s.currentClearStreak === 0 && s.bestClearStreak > 0;

  return (
    <motion.div
      className="pt-2"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={reduced ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {/* orientation */}
      <DateHeader now={now} hour={hour} className="px-1 pt-2" />

      {/* hero circle */}
      <div className="relative grid place-items-center mt-4 mb-1">
        <span aria-hidden className="hero-aura" />
        <button
          onClick={() => setShowHow((v) => !v)}
          className="relative z-10 grid place-items-center"
          aria-expanded={showHow}
          aria-label="What does this circle mean?"
        >
          <YinYang
            yinPct={s.displayYinPct}
            targetPct={s.targetPct}
            size={196}
            breath
            patinaSegments={s.patinaSegments}
            patinaTotal={s.patinaTotal}
            maxYin={s.isAbstinence ? 100 : 95}
            showSeeds={!s.isAbstinence}
            showTarget={!s.isAbstinence}
            coolYang={s.isAbstinence}
          />
        </button>
      </div>

      {/* headline metric — the goal made plain */}
      <div className="text-center">
        {s.goalType === "cutback" && (
          <>
            <div className="text-pearl font-medium">{LEAN_TEXT[s.leaning]}</div>
            <div className="text-pearl-faint text-sm mt-0.5">
              <span className="tnum">{Math.round(s.yinPct)}%</span> alcohol-free · goal <span className="tnum">{Math.round(s.targetPct)}%</span>
            </div>
            {s.inZone && <div className="text-jade text-sm mt-0.5">You're right at your goal. 🌿</div>}
          </>
        )}
        {s.goalType === "quit" && (
          <>
            <div className="font-display text-6xl num-hero tnum leading-none">{s.soberDays}</div>
            <div className="text-pearl-soft text-sm mt-2 uppercase tracking-[0.18em]">
              {s.soberDays === 1 ? "day" : "days"} alcohol-free{s.bestSoberRun > s.soberDays ? ` · best ${s.bestSoberRun}` : ""}
            </div>
          </>
        )}
        {s.goalType === "break" && (
          <>
            <div className="font-display text-2xl text-pearl">
              Day <span className="tnum">{Math.min(s.breakElapsed, s.breakLen)}</span> of <span className="tnum">{s.breakLen}</span>
            </div>
            <div className="mx-auto mt-2 max-w-[220px] h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-jade" style={{ width: `${s.breakProgressPct}%`, transition: "width 0.6s ease" }} />
            </div>
            <div className="text-pearl-soft text-sm mt-1.5">
              {s.breakComplete ? "Break complete — beautifully done. 🌿" : `${s.breakDaysLeft} ${s.breakDaysLeft === 1 ? "day" : "days"} to go`}
            </div>
          </>
        )}
        <button onClick={() => setShowHow((v) => !v)} className="text-xs text-focus underline underline-offset-4 mt-1.5 min-h-touch" aria-expanded={showHow}>
          {showHow ? "Hide details" : "What does this mean?"}
        </button>
      </div>

      {/* how-the-balance-works (merged from the old Balance tab) */}
      <AnimatePresence>
        {showHow && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass rounded-2xl p-4 mt-3 text-sm text-pearl-soft space-y-2">
              <p>
                The circle is your balance of <span className="text-jade">alcohol-free</span> nights (the pale half) and{" "}
                <span className="text-amber">nights you drink</span> (the warm half). It's not a score and not a purity meter — the goal is the balance <em>you</em> chose, not a perfect circle.
              </p>
              <p>
                It starts from your usual week — about <span className="text-pearl">{seed.nightsOut}</span> drinking {seed.nightsOut === 1 ? "night" : "nights"} and{" "}
                <span className="text-pearl">{seed.clearPerWeek}</span> alcohol-free {seed.clearPerWeek === 1 ? "night" : "nights"} — then moves with what you log:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Alcohol-free night → <span className="text-jade">+{YIN_WEIGHTS.clear_night} clear</span></li>
                <li>Got through a craving → <span className="text-jade">+{YIN_WEIGHTS.urge_surf} clear</span></li>
                <li>Morning-after recovery → <span className="text-jade">+{YIN_WEIGHTS.soft_landing} clear</span></li>
                <li>Each drink → <span className="text-amber">+{YANG_PER_DRINK} drinking</span></li>
              </ul>
              <p className="text-pearl-faint">No hidden math. Slipping isn't failing — you can change your goal anytime in Settings.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* comeback note — the Abstinence-Violation-Effect antidote */}
      {inComeback && (
        <div className="glass rounded-2xl p-4 mt-3 text-center">
          <div className="text-pearl font-medium">{s.isAbstinence ? "A lapse isn't a relapse." : "Welcome back."}</div>
          <p className="text-sm text-pearl-soft mt-1">
            {s.isAbstinence
              ? `Your best run of ${s.bestSoberRun} ${s.bestSoberRun === 1 ? "day" : "days"} still happened, and your lifetime totals never moved. Begin again today.`
              : `Your best run of ${s.bestClearStreak} days still counts, and your lifetime totals never moved. A slip is data, not defeat.`}
          </p>
        </div>
      )}

      {/* break finished */}
      {s.goalType === "break" && s.breakComplete && (
        <div className="glass-strong rounded-3xl p-5 mt-3 text-center">
          <div className="font-display text-xl text-pearl">You finished your {s.breakLen}-day break 🌿</div>
          <p className="text-sm text-pearl-soft mt-1">However it went, you proved you can. What's next?</p>
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <button onClick={() => setGoal("break", { breakDays: s.breakLen })} className="btn-primary rounded-2xl min-h-touch font-semibold px-4">Another {s.breakLen} days</button>
            <button onClick={() => navigate("/settings")} className="raised rounded-2xl min-h-touch px-4 text-pearl">Adjust my goal</button>
          </div>
        </div>
      )}

      {/* THE one primary action */}
      <div className="mt-4">
        <DailyStateCard
          action={action}
          isAbstinence={s.isAbstinence}
          abstinenceSub={s.isAbstinence ? "Check in and stay on track tonight." : undefined}
          onNavigate={navigate}
          onMood={logMood}
        />
      </div>

      {/* always-available craving net — the key secondary support */}
      <button
        onClick={() => navigate("/urge")}
        className="w-full mt-2.5 rounded-2xl p-4 flex items-center gap-3.5 active:scale-[0.99] transition-transform relative overflow-hidden"
        style={{ background: "linear-gradient(165deg, rgba(57,182,196,0.16), rgba(24,30,54,0.6))", border: "1px solid rgba(57,182,196,0.28)", boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.12), 0 12px 30px -20px rgba(0,0,0,0.9)" }}
      >
        <motion.span
          className="grid place-items-center h-11 w-11 rounded-2xl shrink-0 text-xl"
          style={{ background: "rgba(57,182,196,0.2)", border: "1px solid rgba(57,182,196,0.34)" }}
          aria-hidden
          animate={reduced ? {} : { scale: [1, 1.1, 1] }}
          transition={reduced ? undefined : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        >
          🌊
        </motion.span>
        <span className="flex-1 text-left min-w-0">
          <span className="block font-semibold text-pearl">Feeling a craving?</span>
          <span className="block text-xs text-pearl-faint">Tap if you want to drink right now — we'll get through it together.</span>
        </span>
        <span className="text-teal shrink-0 grid place-items-center h-7 w-7 rounded-full" style={{ background: "rgba(57,182,196,0.18)" }} aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
        </span>
      </button>

      {/* quiet secondary nightly entries (de-duplicated against the primary) */}
      {secondary.length > 0 && (
        <div className={`grid gap-2.5 mt-2.5 ${secondary.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {secondary.map((x) => (
            <QuickLink key={x.key} emoji={x.emoji} label={x.label} onClick={() => navigate(x.to)} />
          ))}
        </div>
      )}

      {/* compact evening mood prompt (only if not already asked above) */}
      {showMoodRow && (
        <div className="glass rounded-2xl p-4 mt-2.5">
          <div className="text-sm text-pearl-soft mb-2.5">How was today?</div>
          <MoodPicker value={null} onChange={logMood} />
        </div>
      )}

      {/* gentle continuity — progressive: only real, non-zero wins (a ₹0 tile in
          the success colour would read as placeholder data). Each tile is gated
          independently and the row collapses to one column when only one shows. */}
      {(streakVal > 0 || s.moneyKept > 0) && (
        <div className={`grid gap-2.5 mt-3 ${streakVal > 0 && s.moneyKept > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
          {streakVal > 0 && (
            <MetricTile label={s.isAbstinence ? "Days alcohol-free" : "Nights in a row"} accent="jade" hint={`best ${s.isAbstinence ? s.bestSoberRun : s.bestClearStreak}`} onClick={() => navigate("/progress")}>
              <Counter value={streakVal} />
            </MetricTile>
          )}
          {s.moneyKept > 0 && (
            <MetricTile label="Money kept" accent="jade" hint="never goes down" onClick={() => navigate("/progress")}>
              <Counter value={s.moneyKept} prefix={currencySymbol(profile.currency)} />
            </MetricTile>
          )}
        </div>
      )}

      {/* recent nights */}
      <div className="mt-3">
        <DayStrip days={days} lastLoggedDay={undo?.day} currency={profile.currency} />
      </div>

      <div className="mt-5 mb-2 px-1">
        <Mascot context="home" quip={quipFor("home", s.currentClearStreak)} />
      </div>

      {/* undo the just-logged entry */}
      <AnimatePresence>
        {undo && (
          <motion.div
            className="fixed above-nav left-1/2 -translate-x-1/2 z-[70] px-4 w-full max-w-sm"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.3 }}
            role="status"
          >
            <div className="glass-strong rounded-2xl pl-4 pr-2 py-2.5 flex items-center gap-3 border border-white/20">
              <span className="flex-1 text-sm text-pearl">{undo.label || "Logged."}</span>
              <button onClick={doUndo} className="raised rounded-xl px-3 py-1.5 text-sm font-medium text-pearl active:scale-95 transition">Undo</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast show={!!toast}>{toast}</Toast>
      <AnimatePresence>{showTour && <IntroTour onClose={closeTour} />}</AnimatePresence>
    </motion.div>
  );
}

function QuickLink({ emoji, label, onClick }) {
  return (
    <button onClick={onClick} className="raised rounded-2xl p-3 flex items-center gap-2.5 text-sm font-medium text-pearl active:scale-[0.98] transition min-h-touch">
      {emoji && (
        <span aria-hidden className="grid place-items-center h-9 w-9 rounded-xl text-base shrink-0" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
          {emoji}
        </span>
      )}
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}
