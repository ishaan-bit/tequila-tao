// src/screens/Home.jsx — the calm home. One clear "what do I do now?" action that
// changes with the time of day, plain language throughout, and the balance detail
// (formerly its own "Balance" tab) folded in as a tap-to-open section.
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useProfile, useStats, useStore } from "../app/hooks.js";
import { useReducedMotion } from "../app/motion.js";
import { addEvent, removeEvent, updateProfile, setGoal } from "../app/store.js";
import { currencySymbol } from "../app/format.js";
import { YIN_WEIGHTS, YANG_PER_DRINK, baselineSeed, recentDays } from "../app/selectors.js";
import { success } from "../app/haptics.js";
import { play } from "../app/sound.js";
import YinYang from "../components/YinYang.jsx";
import Mascot, { quipFor } from "../components/Mascot.jsx";
import { MetricTile, MoodPicker, Counter, Button } from "../components/ui.jsx";
import { Toast } from "../components/Feedback.jsx";
import IntroTour from "../components/IntroTour.jsx";
import DayStrip from "../components/DayStrip.jsx";
import { StatusMark } from "../components/status.jsx";

// Plain-language balance read (was "Leaning clear / Centered / Leaning warm",
// which gave no hint that "warm" means drinking more).
const LEAN_TEXT = {
  clear: "On track — mostly alcohol-free",
  centered: "A steady mix of nights",
  warm: "Drinking a bit more lately",
};
function greeting(part) {
  return part === "morning" ? "Good morning" : part === "evening" || part === "night" ? "Good evening" : "Good afternoon";
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useProfile();
  const s = useStats();
  const state = useStore();
  const reduced = useReducedMotion();
  const [toast, setToast] = useState("");
  const [showHow, setShowHow] = useState(false);
  const [undo, setUndo] = useState(null); // { id, label } — the just-logged entry
  const toastTimer = useRef(0);
  const undoTimer = useRef(0);
  useEffect(() => () => {
    clearTimeout(toastTimer.current);
    clearTimeout(undoTimer.current);
  }, []);

  const days = recentDays(state, 28);

  // A log flow hands back the new event id so it can be undone right here — a
  // mis-tapped "I drank" must be reversible (the Abstinence-Violation-Effect
  // shame spiral is exactly what an unrecoverable mistake would trigger).
  useEffect(() => {
    const jl = location.state?.justLogged;
    if (!jl?.id) return;
    setUndo(jl);
    // Consume the router state so a refresh/back can't resurrect the bar.
    navigate(location.pathname, { replace: true, state: null });
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 6500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const doUndo = () => {
    if (undo?.id) {
      removeEvent(undo.id);
      success();
    }
    clearTimeout(undoTimer.current);
    setUndo(null);
  };

  // First-launch how-to: shown once, then remembered on-device.
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
    setToast("Noted. Showing up counts.");
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  };

  // ---- the single time-aware primary action ----
  const hour = new Date().getHours();
  const part = hour < 4 ? "night" : hour < 12 ? "morning" : hour < 17 ? "day" : "evening";
  const yesterday = s.last7?.[s.last7.length - 2];
  const drankLastNight = s.drankToday || yesterday?.status === "drank";
  const needsCheckin = s.moodToday == null;

  // Resolve to one of: a morning recovery CTA, a "tonight's already logged"
  // confirmation, an inline daily check-in, or the nightly decision.
  let primary;
  if (part === "morning" && drankLastNight) {
    primary = { kind: "cta", emoji: "🌅", label: "Morning after", sub: "A few small things to feel better", to: "/recover" };
  } else if (s.decidedToday) {
    primary = { kind: "logged" };
  } else if ((part === "morning" || part === "day") && needsCheckin) {
    primary = { kind: "checkin" };
  } else {
    primary = {
      kind: "cta",
      emoji: "🌙",
      label: "Tonight",
      sub: s.isAbstinence ? "Check in and stay on track tonight" : "Decide and log whether you'll drink",
      to: "/crossroads",
    };
  }
  const todayStatus = s.drankToday ? "drank" : s.frozenToday ? "frozen" : "clear";

  const seed = baselineSeed(profile);

  return (
    <motion.div
      className="pt-2"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={reduced ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {/* header */}
      <div className="flex items-center justify-between px-1 pt-2">
        <div>
          <div className="text-pearl-faint text-xs uppercase tracking-[0.18em]">
            {greeting(part)} · Level {s.levelIndex + 1} · {s.level.title}
          </div>
          <h1 className="font-display text-2xl text-pearl">Home</h1>
        </div>
      </div>

      {/* yin-yang — tap to learn what it means */}
      <div className="relative grid place-items-center mt-4 mb-2">
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
            size={210}
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
      <div className="text-center">
        {/* The headline metric is the goal: a balance read for cutback, a sober-day
            count for quit, a day-of-N countdown for a break. */}
        {s.goalType === "cutback" && (
          <>
            <div className="text-pearl">
              <span className="font-medium">{LEAN_TEXT[s.leaning]}</span>
            </div>
            <div className="text-pearl-faint text-sm mt-0.5">
              <span className="tnum">{Math.round(s.yinPct)}%</span> alcohol-free · goal{" "}
              <span className="tnum">{Math.round(s.targetPct)}%</span>
            </div>
            {s.inZone && <div className="text-jade text-sm mt-0.5">You're right at your goal. 🌿</div>}
          </>
        )}

        {s.goalType === "quit" && (
          <>
            <div className="font-display text-4xl text-pearl tnum leading-none">{s.soberDays}</div>
            <div className="text-pearl-soft text-sm mt-1.5">
              {s.soberDays === 1 ? "day" : "days"} alcohol-free
              {s.bestSoberRun > s.soberDays ? ` · best ${s.bestSoberRun}` : ""}
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

        <button
          onClick={() => setShowHow((v) => !v)}
          className="text-xs text-focus underline underline-offset-4 mt-1.5 min-h-touch"
          aria-expanded={showHow}
        >
          {showHow ? "Hide details" : "What does this mean?"}
        </button>
      </div>

      {/* merged "how your balance works" (the old Balance tab's one unique asset) */}
      <AnimatePresence>
        {showHow && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-2xl p-4 mt-3 text-sm text-pearl-soft space-y-2">
              <p>
                The circle shows your balance of <span className="text-jade">alcohol-free</span> nights (the pale half) vs.{" "}
                <span className="text-amber">nights you drink</span> (the warm half). It's not a score and not a purity meter — the
                goal is the balance <em>you</em> chose (the dashed line), not a perfect circle.
              </p>
              <p>
                It starts from your typical week — about <span className="text-pearl">{seed.nightsOut}</span> drinking{" "}
                {seed.nightsOut === 1 ? "night" : "nights"} and <span className="text-pearl">{seed.clearPerWeek}</span> alcohol-free{" "}
                {seed.clearPerWeek === 1 ? "night" : "nights"} — then moves with everything you log:
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

      {/* Comeback note. For abstinence goals this is the Abstinence-Violation-Effect
          antidote: name the slip as a lapse so guilt doesn't snowball into a relapse. */}
      {(s.isAbstinence ? s.soberDays === 0 && s.bestSoberRun > 0 : s.currentClearStreak === 0 && s.bestClearStreak > 0) && (
        <div className="glass rounded-2xl p-4 mt-3 text-center">
          <div className="text-pearl font-medium">{s.isAbstinence ? "A lapse isn't a relapse." : "Welcome back."}</div>
          <p className="text-sm text-pearl-soft mt-1">
            {s.isAbstinence
              ? `Your best run of ${s.bestSoberRun} ${s.bestSoberRun === 1 ? "day" : "days"} still happened, and your lifetime totals never moved. One night doesn't undo it — begin again today.`
              : `Your best run of ${s.bestClearStreak} days still counts, and your lifetime totals never moved. A slip is data, not defeat.`}
          </p>
        </div>
      )}

      {/* Break finished: celebrate, then offer the evidence-backed next step
          (another round, or revisit the goal — many reduce for good afterwards). */}
      {s.goalType === "break" && s.breakComplete && (
        <div className="glass-strong rounded-3xl p-5 mt-4 text-center">
          <div className="font-display text-xl text-pearl">You finished your {s.breakLen}-day break 🌿</div>
          <p className="text-sm text-pearl-soft mt-1">However it went, you proved you can. What's next?</p>
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <Button variant="primary" onClick={() => setGoal("break", { breakDays: s.breakLen })}>
              Another {s.breakLen} days
            </Button>
            <Button variant="glass" onClick={() => navigate("/settings")}>
              Adjust my goal
            </Button>
          </div>
        </div>
      )}

      {/* THE primary action — what to do right now */}
      <div className="mt-4">
        {primary.kind === "checkin" ? (
          <div className="glass-strong rounded-3xl p-5">
            <div className="text-pearl font-display text-lg">How are you feeling today?</div>
            <p className="text-sm text-pearl-soft mb-3 mt-0.5">One tap. Showing up is the whole habit.</p>
            <MoodPicker value={null} onChange={logMood} />
          </div>
        ) : primary.kind === "logged" ? (
          <div className="glass-strong rounded-3xl p-5 flex items-center gap-4">
            <StatusMark status={todayStatus} size={46} />
            <div className="flex-1">
              <div className="font-display text-lg text-pearl">
                {s.clearToday ? "Tonight's alcohol-free 🌿" : s.frozenToday ? "Tonight's logged — protected" : "Tonight's logged"}
              </div>
              <div className="text-sm text-pearl-soft">
                {s.clearToday
                  ? "Nice choice. Counted and kept."
                  : s.frozenToday
                  ? "A planned night — your streak stayed safe."
                  : "Logged honestly — no shame, your history's safe."}
              </div>
            </div>
            <button
              onClick={() => navigate("/crossroads")}
              className="raised rounded-xl px-3 py-2 text-sm text-pearl shrink-0 active:scale-95 transition"
            >
              Change
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate(primary.to)}
            className="w-full text-left glass-strong rounded-3xl p-5 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl" aria-hidden>{primary.emoji}</span>
              <span className="flex-1">
                <span className="block font-display text-xl text-pearl">{primary.label}</span>
                <span className="block text-sm text-pearl-soft">{primary.sub}</span>
              </span>
              <span className="text-jade text-2xl" aria-hidden>→</span>
            </div>
          </button>
        )}
      </div>

      {/* always-available craving help (the safety net) */}
      <button
        onClick={() => navigate("/urge")}
        className="w-full mt-2.5 glass rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] transition-transform"
      >
        <motion.span
          className="text-xl"
          aria-hidden
          animate={reduced ? {} : { scale: [1, 1.12, 1] }}
          transition={reduced ? undefined : { duration: 2.6, repeat: Infinity }}
        >
          🌊
        </motion.span>
        <span className="flex-1 text-left">
          <span className="block font-semibold text-pearl">Feeling a craving?</span>
          <span className="block text-xs text-pearl-faint">Tap if you want to drink right now — we'll get through it together.</span>
        </span>
        <span className="text-amber" aria-hidden>→</span>
      </button>

      {/* Two ways into the day, no overlap: the nightly decision (which itself
          branches to drinking-or-not, so a night out is logged in there) and the
          morning after. Mirrors the intro tour's "Tonight, and the morning after." */}
      <div className="grid grid-cols-2 gap-2.5 mt-2.5">
        <QuickLink emoji="🌙" label="Tonight" onClick={() => navigate("/crossroads")} />
        <QuickLink emoji="🌅" label="Morning after" onClick={() => navigate("/recover")} />
      </div>

      {/* compact daily check-in (only if not already the primary action) */}
      {primary.kind !== "checkin" && needsCheckin && (
        <div className="glass rounded-3xl p-4 mt-3">
          <div className="text-sm text-pearl-soft mb-2.5">How are you feeling today?</div>
          <MoodPicker value={null} onChange={logMood} />
        </div>
      )}

      {/* two glanceable wins */}
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <MetricTile
          label={s.isAbstinence ? "Days alcohol-free" : "Alcohol-free nights in a row"}
          accent="jade"
          hint={`best ${s.isAbstinence ? s.bestSoberRun : s.bestClearStreak}`}
          onClick={() => navigate("/progress")}
        >
          <Counter value={s.isAbstinence ? s.soberDays : s.currentClearStreak} />
        </MetricTile>
        <MetricTile label="Money kept" accent="jade" hint="never goes down" onClick={() => navigate("/progress")}>
          <Counter value={s.moneyKept} prefix={currencySymbol(profile.currency)} />
        </MetricTile>
      </div>

      {/* scrollable nightly timeline */}
      <div className="mt-3">
        <DayStrip days={days} lastLoggedDay={undo?.day} />
      </div>

      <div className="mt-5 mb-2 px-1">
        <Mascot context="home" quip={quipFor("home", s.currentClearStreak)} />
      </div>

      {/* Undo the entry just logged — defuses the shame of an unrecoverable mis-tap. */}
      <AnimatePresence>
        {undo && (
          <motion.div
            className="fixed left-1/2 -translate-x-1/2 z-[70] px-4 w-full max-w-sm"
            style={{ bottom: "calc(var(--safe-bottom) + 5.5rem)" }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.3 }}
            role="status"
          >
            <div className="glass-strong rounded-2xl pl-4 pr-2 py-2.5 flex items-center gap-3 border border-white/20">
              <span className="flex-1 text-sm text-pearl">{undo.label || "Logged."}</span>
              <button onClick={doUndo} className="raised rounded-xl px-3 py-1.5 text-sm font-medium text-pearl active:scale-95 transition">
                Undo
              </button>
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
    <button
      onClick={onClick}
      className="raised rounded-2xl px-3 py-3.5 flex items-center justify-center gap-2 text-sm text-pearl active:scale-[0.98] transition min-h-touch"
    >
      {emoji && <span aria-hidden className="text-base leading-none">{emoji}</span>}
      <span>{label}</span>
    </button>
  );
}
