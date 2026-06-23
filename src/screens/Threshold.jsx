// src/screens/Threshold.jsx — first-touch splash. No login.
import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useProfile } from "../app/hooks.js";
import { importData } from "../app/store.js";
import { useReducedMotion } from "../app/motion.js";
import YinYang from "../components/YinYang.jsx";
import LazyVideo from "../components/LazyVideo.jsx";
import { Button } from "../components/ui.jsx";

export default function Threshold() {
  const profile = useProfile();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const fileRef = useRef(null);
  const [err, setErr] = useState("");

  // Returning users skip straight to the center.
  if (profile.onboarded) return <Navigate to="/home" replace />;

  const onRestore = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importData(JSON.parse(String(reader.result)));
        // if the backup was onboarded, the redirect above fires on re-render
      } catch {
        setErr("That file didn't look like a Tequila Tao backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <main className="app-bg h-screen-safe relative overflow-hidden grid place-items-center px-6">
      <LazyVideo src="/media/concept.mp4" />
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.2 : 0.8 }}
      >
        <YinYang yinPct={64} targetPct={80} size={200} breath className="mb-7" />
        <h1 className="font-display text-4xl xs:text-5xl text-pearl mb-2">Tequila Tao</h1>
        <p className="text-pearl-soft max-w-xs">Drink less, on your own terms. Track your alcohol-free nights, the money you keep, and ride out cravings — private, on your phone.</p>

        <div className="mt-9 w-full max-w-xs space-y-3">
          <Button variant="primary" full onClick={() => navigate("/onboarding")}>
            Get started
          </Button>
          <button onClick={() => fileRef.current?.click()} className="text-sm text-pearl-soft underline underline-offset-4 decoration-white/30 hover:text-pearl min-h-touch">
            Restore from a backup
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={onRestore} className="hidden" />
          {err && <p className="text-xs text-amber">{err}</p>}
        </div>
        <p className="mt-6 text-xs text-pearl-faint">No account. Nothing leaves your phone.</p>
      </motion.div>
    </main>
  );
}
