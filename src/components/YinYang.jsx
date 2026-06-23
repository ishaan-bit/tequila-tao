// src/components/YinYang.jsx
// The living centerpiece. Pure inline SVG — pin-sharp from 48px to full-screen,
// resolution independent, no image dependency (fixes the old black-on-black PNG
// render). The divider is an area-exact chord softened into a point-symmetric
// S-curve (the symmetry preserves the exact yin/yang area ratio). Seed-dots are
// individually addressable and double as Tao's eyes. A gold patina arc grows
// with milestones. Idle breathing runs at ~6 breaths/min — a calm-down pacer
// hiding inside the logo.
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useReducedMotion, SPRING } from "../app/motion.js";

const R = 100;

function clamp(x, a, b) {
  return Math.min(b, Math.max(a, x));
}

// SVG-y of the area-exact chord for a given Yang fraction (Yang is the bottom
// lobe). Solved by bisection on the circular-segment area formula.
function chordY(yangFrac) {
  const areaBelow = (y0) => {
    const t = clamp(y0 / R, -1, 1);
    const root = Math.sqrt(Math.max(0, R * R - y0 * y0));
    return y0 * root + R * R * (Math.asin(t) + Math.PI / 2);
  };
  const circleArea = Math.PI * R * R;
  const target = clamp(yangFrac, 0, 1) * circleArea;
  let lo = -R;
  let hi = R;
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi);
    if (areaBelow(mid) < target) lo = mid;
    else hi = mid;
  }
  const yMath = 0.5 * (lo + hi);
  return -yMath; // SVG coords (+y down)
}

export default function YinYang({
  yinPct = 50,
  targetPct = null,
  size = 280,
  breath = false,
  showSeeds = true,
  showTarget = true,
  // Upper bound on the displayed clear-side. Cutback caps at 95% ("balance, not
  // a purity meter"), but abstinence goals pass 100 so the circle can fill into a
  // complete clear circle — the app must never force a drinking sliver on someone
  // whose goal is to stay off it entirely.
  maxYin = 95,
  // Abstinence circles use a calm night-sky lobe instead of the warm "drinking"
  // gradient, so a sober person reads it as a moon waxing to full, not as red.
  coolYang = false,
  patinaSegments = 0,
  patinaTotal = 6,
  onSeedTap, // (which: 'yin' | 'yang') => void
  className = "",
  ariaLabel,
}) {
  const reduced = useReducedMotion();
  const yin = clamp(yinPct, 5, maxYin);
  const yangFrac = 1 - yin / 100;

  const yCut = useMemo(() => chordY(yangFrac), [yangFrac]);
  const yCutTarget = useMemo(
    // Allow the marker right up near the rim so abstinence goals (break/quit) read
    // as "aim for a full, clear circle" rather than capping at 95%.
    () => (targetPct == null ? null : chordY(1 - clamp(targetPct, 5, 98) / 100)),
    [targetPct]
  );

  const b = 9; // S-curve amplitude (point-symmetric → area preserved)
  // Top lobe (Yin / pearl). Right-to-left along the divider closes the shape.
  const yinPath = `M ${-R} ${-R} L ${R} ${-R} L ${R} ${yCut} C ${R * 0.5} ${yCut + b}, ${-R * 0.5} ${yCut - b}, ${-R} ${yCut} Z`;
  const yangPath = `M ${-R} ${R} L ${R} ${R} L ${R} ${yCut} C ${R * 0.5} ${yCut + b}, ${-R * 0.5} ${yCut - b}, ${-R} ${yCut} Z`;
  const dividerPath = `M ${-R} ${yCut} C ${-R * 0.5} ${yCut - b}, ${R * 0.5} ${yCut + b}, ${R} ${yCut}`;

  // Seed dot centres (kept fully inside their lobe).
  const dotR = 11;
  const yinDotY = clamp((-R + yCut) / 2, -R + dotR + 3, R - dotR - 3);
  const yangDotY = clamp((yCut + R) / 2, -R + dotR + 3, R - dotR - 3);

  // Patina arc: one growing gold stroke, length = segments out of total.
  const seg = clamp(patinaSegments, 0, patinaTotal);

  const label =
    ariaLabel || `Balance: ${Math.round(yin)} percent alcohol-free, ${Math.round(100 - yin)} percent drinking`;

  const Seed = ({ y, fill, which }) => {
    const props = {
      cx: 0,
      cy: y,
      r: dotR,
      fill,
      style: onSeedTap ? { cursor: "pointer" } : undefined,
    };
    if (!onSeedTap) return <circle {...props} />;
    return (
      <circle
        {...props}
        role="button"
        tabIndex={0}
        aria-label={which === "yin" ? "A short calming thought" : "Promise one safe choice tonight"}
        onClick={(e) => {
          e.stopPropagation();
          onSeedTap(which);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSeedTap(which);
          }
        }}
      />
    );
  };

  const Inner = (
    <svg
      viewBox="-110 -110 220 220"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <clipPath id="yy-clip">
          <circle cx="0" cy="0" r={R} />
        </clipPath>
        <linearGradient id="yy-yin" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#FBF8F0" />
          <stop offset="100%" stopColor="#E7E0CE" />
        </linearGradient>
        <linearGradient id="yy-yang" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={coolYang ? "#16223f" : "#9A0A2C"} />
          <stop offset="100%" stopColor={coolYang ? "#33507e" : "#EF9A6B"} />
        </linearGradient>
        <radialGradient id="yy-glow" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="rgba(244,241,232,0.18)" />
          <stop offset="100%" stopColor="rgba(244,241,232,0)" />
        </radialGradient>
      </defs>

      {/* soft glow halo */}
      <circle cx="0" cy="0" r={R + 8} fill="url(#yy-glow)" />

      <g clipPath="url(#yy-clip)">
        <motion.path fill="url(#yy-yin)" initial={false} animate={{ d: yinPath }} transition={reduced ? { duration: 0 } : SPRING} d={yinPath} />
        <motion.path fill="url(#yy-yang)" initial={false} animate={{ d: yangPath }} transition={reduced ? { duration: 0 } : SPRING} d={yangPath} />
        {/* crisp divider */}
        <motion.path
          fill="none"
          stroke="rgba(11,14,26,0.55)"
          strokeWidth="1.2"
          initial={false}
          animate={{ d: dividerPath }}
          transition={reduced ? { duration: 0 } : SPRING}
          d={dividerPath}
        />
        {/* seeds */}
        {showSeeds && (
          <>
            <Seed y={yinDotY} fill="#9A0A2C" which="yin" />
            <Seed y={yangDotY} fill="#FBF8F0" which="yang" />
          </>
        )}
      </g>

      {/* target marker */}
      {showTarget && yCutTarget != null && (
        <line
          x1={-R}
          y1={yCutTarget}
          x2={R}
          y2={yCutTarget}
          stroke="rgba(216,178,74,0.9)"
          strokeWidth="1.4"
          strokeDasharray="5 5"
          clipPath="url(#yy-clip)"
        />
      )}

      {/* pearl rim */}
      <circle cx="0" cy="0" r={R} fill="none" stroke="rgba(244,241,232,0.35)" strokeWidth="1.5" />

      {/* gold patina arc — grows one notch per milestone */}
      {seg > 0 && (
        <circle
          cx="0"
          cy="0"
          r={R + 3.5}
          fill="none"
          stroke="#D8B24A"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={patinaTotal}
          strokeDasharray={`${seg} ${patinaTotal - seg}`}
          strokeDashoffset={patinaTotal * 0.25}
          transform="rotate(-90)"
          style={{ filter: "drop-shadow(0 0 4px rgba(216,178,74,0.5))" }}
        />
      )}
    </svg>
  );

  if (breath && !reduced) {
    return (
      <motion.div
        className={className}
        style={{ width: size, height: size, willChange: "transform" }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        {Inner}
      </motion.div>
    );
  }
  return (
    <div className={className} style={{ width: size, height: size }}>
      {Inner}
    </div>
  );
}
