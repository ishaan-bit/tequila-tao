// src/components/IntroTour.jsx
// First-launch how-to. A calm, skippable carousel shown once on the first visit
// to Home (gated by profile.tourSeen). It explains the living circle, the
// transparent economy, the nightly actions, and where everything lives — so the
// "starts leaning warm" balance reads as intended, not as a low score.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "../app/motion.js";
import { tap, success } from "../app/haptics.js";
import YinYang from "./YinYang.jsx";
import { Button } from "./ui.jsx";

function Medallion({ children }) {
  return (
    <div className="mx-auto mb-5 grid place-items-center h-24 w-24 rounded-full glass-strong text-4xl" aria-hidden>
      {children}
    </div>
  );
}

const SLIDES = [
  {
    key: "circle",
    kicker: "Welcome",
    title: "This circle is your balance",
    visual: <YinYang yinPct={64} targetPct={80} size={128} breath showSeeds className="mx-auto mb-5" />,
    body: [
      "It isn't a score. The pale half is your alcohol-free nights; the warm half is nights you drink. The goal is balance — not a perfect circle.",
      "It starts from your usual week, then grows with every alcohol-free night, craving you get through, and morning-after recovery. The dashed line is the goal you chose.",
    ],
  },
  {
    key: "economy",
    kicker: "No hidden points",
    title: "Real numbers, shown before you confirm",
    visual: <Medallion>🌙</Medallion>,
    body: [
      "An alcohol-free night adds to your money kept and drinks avoided, plus +1 to your streak. Getting through a craving is the most-rewarded thing here.",
      "You can see the whole formula on the Home screen — nothing hidden.",
    ],
  },
  {
    key: "nightly",
    kicker: "Two simple actions",
    title: "Tonight, and the morning after",
    visual: <Medallion>🌅</Medallion>,
    body: [
      "Tap “Tonight” to decide whether you'll drink. Choosing to drink is logged honestly — no shame, and your streak pauses, never resets to zero.",
      "“Morning after” helps you recover and feel better. Looking after yourself grows the alcohol-free side.",
    ],
  },
  {
    key: "urge",
    kicker: "When a craving hits",
    title: "Get through it together",
    visual: <Medallion>🌊</Medallion>,
    body: [
      "Cravings usually fade within about 20 minutes. The craving tool breathes with you and shows the intensity fall.",
      "It's reachable any time, right from the home screen.",
    ],
  },
  {
    key: "yours",
    kicker: "Yours alone",
    title: "On your device, nothing leaves",
    visual: <Medallion>🌿</Medallion>,
    body: [
      "No account, no servers, no tracking. Use the tabs below: Home, Progress, Settings.",
      "You can replay this guide any time from Settings. A slip is data, not defeat — come on back.",
    ],
  },
];

export default function IntroTour({ onClose }) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const ctaRef = useRef(null);
  const last = SLIDES.length - 1;
  const slide = SLIDES[step];

  useEffect(() => {
    const t = setTimeout(() => ctaRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [step]);

  const close = (completed) => {
    if (completed) success();
    onClose?.();
  };
  const next = () => {
    if (step < last) {
      tap();
      setStep(step + 1);
    } else {
      close(true);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[90] grid place-items-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: "rgba(11,14,26,0.82)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="How Tequila Tao works"
      onKeyDown={(e) => {
        if (e.key === "Escape") close(false);
      }}
    >
      <div className="glass-strong rounded-3xl p-6 max-w-sm w-full">
        {/* progress + skip */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1.5" aria-hidden>
            {SLIDES.map((s, i) => (
              <span key={s.key} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-jade" : "w-1.5 bg-white/25"}`} />
            ))}
          </div>
          {step < last && (
            <button onClick={() => close(false)} className="text-sm text-pearl-soft hover:text-pearl px-2 min-h-touch">
              Skip
            </button>
          )}
        </div>

        {/* slide */}
        <div className="min-h-[19rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.key}
              initial={{ opacity: 0, x: reduced ? 0 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduced ? 0 : -20 }}
              transition={{ duration: reduced ? 0.15 : 0.3 }}
            >
              <div className="grid place-items-center">{slide.visual}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-jade text-center mb-1">{slide.kicker}</div>
              <h2 className="font-display text-2xl text-pearl text-center mb-3">{slide.title}</h2>
              <div className="space-y-2 text-sm text-pearl-soft text-center">
                {slide.body.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* nav */}
        <div className="flex items-center gap-3 mt-6">
          {step > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                tap();
                setStep(step - 1);
              }}
            >
              Back
            </Button>
          )}
          <Button ref={ctaRef} variant="primary" full onClick={next}>
            {step < last ? "Next" : "Begin"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
