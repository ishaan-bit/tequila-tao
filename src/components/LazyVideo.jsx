// src/components/LazyVideo.jsx
// Cinematic accents that never block first paint. The designed UI renders
// instantly; video only loads after the browser is idle, and is skipped
// entirely under reduced-motion or Save-Data. Always muted + playsInline so
// iOS Safari will actually autoplay it (or quietly fall back to a gradient).
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../app/motion.js";

export default function LazyVideo({ src, className = "", style, objectFit = "cover", overlay = true }) {
  const reduced = useReducedMotion();
  const [load, setLoad] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (reduced) return; // honour reduced motion
    const conn = typeof navigator !== "undefined" && (navigator.connection || navigator.webkitConnection);
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ""))) return; // honour Save-Data / slow nets
    // iOS Safari has neither requestIdleCallback nor cancelIdleCallback — track
    // which scheduler was used so the fallback timeout is actually cleared.
    const hasRIC = typeof window.requestIdleCallback === "function";
    const id = hasRIC ? window.requestIdleCallback(() => setLoad(true)) : setTimeout(() => setLoad(true), 600);
    return () => {
      if (hasRIC) window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [reduced]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} style={style} aria-hidden="true">
      {/* instant gradient base — what shows under reduced motion / before load / if autoplay is blocked */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 20%, rgba(128,0,32,0.45), transparent 60%), linear-gradient(180deg, #141a2e, #0b0e1a)",
        }}
      />
      {load && (
        <video
          ref={ref}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={() => setLoad(false)}
          className="absolute inset-0 h-full w-full"
          style={{ objectFit, opacity: 0.55, transition: "opacity 1s ease" }}
        />
      )}
      {overlay && (
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,14,26,0.35), rgba(11,14,26,0.85))" }} />
      )}
    </div>
  );
}
