// src/components/AppShell.jsx — main layout with a safe-area bottom tab bar.
// Three plain tabs: Home · Progress · Settings. (The old "Center" + "Balance"
// were near-duplicate surfaces; Balance's detail now lives inside Home.)
import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { tap } from "../app/haptics.js";

const TABS = [
  { to: "/home", label: "Home", icon: HomeIcon },
  { to: "/progress", label: "Progress", icon: GardenIcon },
  { to: "/settings", label: "Settings", icon: GearIcon },
];

export default function AppShell() {
  const { pathname } = useLocation();
  const mainRef = useRef(null);
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
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 w-full max-w-xl mx-auto px-safe pb-28 pt-safe focus:outline-none">
        <Outlet />
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 glass-strong border-t border-white/10"
        style={{ paddingBottom: "var(--safe-bottom)" }}
        aria-label="Primary"
      >
        <div className="max-w-xl mx-auto grid grid-cols-3">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              onClick={() => tap()}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 py-2.5 min-h-touch text-[11px] font-medium transition-colors ${
                  isActive ? "text-jade" : "text-pearl-soft hover:text-pearl"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute top-0 h-[3px] w-10 rounded-full bg-jade shadow-[0_0_8px] shadow-jade/50" aria-hidden />}
                  <t.icon active={isActive} />
                  <span>{t.label}</span>
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
