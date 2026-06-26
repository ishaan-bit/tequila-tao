// src/components/AppShell.jsx — main layout with a floating, rounded bottom tab
// bar. Three plain tabs: Home · Progress · Settings. The active tab carries a
// soft jade "pill" that glides between tabs (shared layoutId), which reads far
// more modern than the old edge-to-edge slab with a static top tick.
import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { tap } from "../app/haptics.js";
import { useReducedMotion } from "../app/motion.js";

const TABS = [
  { to: "/home", label: "Home", icon: HomeIcon },
  { to: "/progress", label: "Progress", icon: GardenIcon },
  { to: "/settings", label: "Settings", icon: GearIcon },
];

export default function AppShell() {
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const reduced = useReducedMotion();
  // On a tab change, move focus to the page container so keyboard/AT users aren't
  // stranded on the bottom nav and the new screen is perceivable.
  useEffect(() => {
    mainRef.current?.focus();
  }, [pathname]);

  return (
    <div className="app-bg min-h-screen-safe flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:glass-strong focus:rounded-xl focus:px-4 focus:py-2 focus:text-pearl"
      >
        Skip to content
      </a>
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 w-full max-w-xl mx-auto px-safe pb-nav pt-safe focus:outline-none">
        <Outlet />
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 px-3"
        style={{ paddingBottom: "calc(var(--safe-bottom) + var(--nav-gap))" }}
        aria-label="Primary"
      >
        <div className="max-w-xl mx-auto nav-surface rounded-[1.5rem] grid grid-cols-3 gap-1 p-1.5" style={{ minHeight: "var(--nav-h)" }}>
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              onClick={() => tap()}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 rounded-[1.1rem] py-1.5 min-h-touch text-[11px] font-semibold transition-colors ${
                  isActive ? "text-jade" : "text-pearl-soft hover:text-pearl"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="navpill"
                      className="absolute inset-0 nav-pill rounded-[1.1rem]"
                      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                      aria-hidden
                    />
                  )}
                  <span className="relative z-10 flex flex-col items-center gap-1">
                    <t.icon active={isActive} />
                    <span>{t.label}</span>
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10.5 12 4l9 6.5" />
      <path d="M5 9.5V20h14V9.5" />
    </svg>
  );
}
function GardenIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21v-7" />
      <path d="M12 14c0-3 2.5-4.5 5-4.5C17 13 14.5 14 12 14Z" />
      <path d="M12 14c0-3-2.5-4.5-5-4.5C7 13 9.5 14 12 14Z" />
    </svg>
  );
}
function GearIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
    </svg>
  );
}
