// src/main.jsx — router, route guards, lazy screens.
import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MotionConfig } from "framer-motion";
// Self-hosted fonts (latin subset only) — no Google CDN, so nothing leaves the
// device and typography works fully offline. Vite hashes the woff2 into /assets,
// where the immutable cache headers + service worker pick them up.
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/playfair-display/latin-600.css";
import "@fontsource/playfair-display/latin-700.css";
import "./index.css";
import { useProfile } from "./app/hooks.js";
import AppShell from "./components/AppShell.jsx";
import AdaptiveTheme from "./components/AdaptiveTheme.jsx";
import FirstRunPermissions from "./components/FirstRunPermissions.jsx";

// Eager: the entry splash (tiny, instant first paint).
import Threshold from "./screens/Threshold.jsx";

// Lazy: everything else, split per route.
const Onboarding = lazy(() => import("./screens/Onboarding.jsx"));
const Home = lazy(() => import("./screens/Home.jsx"));
const Crossroads = lazy(() => import("./screens/Crossroads.jsx"));
const Clarity = lazy(() => import("./screens/Clarity.jsx"));
const Sendoff = lazy(() => import("./screens/Sendoff.jsx"));
const Urge = lazy(() => import("./screens/Urge.jsx"));
const Recover = lazy(() => import("./screens/Recover.jsx"));
const ProgressScreen = lazy(() => import("./screens/Progress.jsx"));
const Settings = lazy(() => import("./screens/Settings.jsx"));
const Guide = lazy(() => import("./screens/Guide.jsx"));
const Privacy = lazy(() => import("./screens/Privacy.jsx"));
const Terms = lazy(() => import("./screens/Terms.jsx"));
const About = lazy(() => import("./screens/About.jsx"));

function Loading() {
  return (
    <div className="app-bg h-screen-safe grid place-items-center">
      <div className="h-8 w-8 rounded-full border-2 border-pearl/30 border-t-pearl animate-spin" />
    </div>
  );
}

function RequireOnboarded({ children }) {
  const { onboarded } = useProfile();
  return onboarded ? children : <Navigate to="/" replace />;
}

// Keep an already-onboarded user from re-running setup (which would overwrite
// their saved baseline/target with defaults).
function RedirectIfOnboarded({ children }) {
  const { onboarded } = useProfile();
  return onboarded ? <Navigate to="/home" replace /> : children;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Belt-and-braces for the OS reduced-motion setting across all Framer
          motion. The in-app override is still handled by useReducedMotion. */}
      <MotionConfig reducedMotion="user">
      <AdaptiveTheme />
      {/* One-time first-run consent for notifications + backup. Self-hides once
          shown (onboarded && !permsAsked); overlays the app on first launch. */}
      <FirstRunPermissions />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Threshold />} />
          <Route path="/onboarding" element={<RedirectIfOnboarded><Onboarding /></RedirectIfOnboarded>} />

          {/* full-screen guarded flows */}
          <Route path="/crossroads" element={<RequireOnboarded><Crossroads /></RequireOnboarded>} />
          <Route path="/clarity" element={<RequireOnboarded><Clarity /></RequireOnboarded>} />
          <Route path="/sendoff" element={<RequireOnboarded><Sendoff /></RequireOnboarded>} />
          <Route path="/urge" element={<RequireOnboarded><Urge /></RequireOnboarded>} />
          <Route path="/recover" element={<RequireOnboarded><Recover /></RequireOnboarded>} />

          {/* /balance merged into Home (3-tab IA) — keep the path alive as a redirect */}
          <Route path="/balance" element={<Navigate to="/home" replace />} />

          {/* shell (bottom tabs) */}
          <Route element={<RequireOnboarded><AppShell /></RequireOnboarded>}>
            <Route path="/home" element={<Home />} />
            <Route path="/progress" element={<ProgressScreen />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* public info pages */}
          <Route path="/guide" element={<Guide />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/about" element={<About />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>
);

// Register the offline service worker (production only).
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// Side-effects, kept out of render:
//  • initCloud — opt-in cloud backup/push. A no-op unless the user turned it on;
//    importing it does NOT pull in the Firebase SDK (that's dynamic-imported only
//    when sync actually runs), so non-sync users ship none of it.
//  • syncReminder — the on-device daily check-in reminder + drink-limit nudge.
//    Works on native (real OS schedules) AND web (Triggers where supported).
//    Silent: it only (re)schedules if permission is already granted, so nobody
//    is prompted on launch — the first-run consent screen owns the asking.
//  • runWebCatchup — on browsers without background scheduling, posts a due
//    reminder when the app is opened/re-focused. No-op on native.
import { getState } from "./app/store.js";
import { initCloud } from "./app/cloud.js";
import { syncReminder, runWebCatchup } from "./app/notifications.js";
initCloud();
if (getState().profile?.onboarded) {
  syncReminder(getState().settings);
  runWebCatchup();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") runWebCatchup();
  });
}

// Native (Capacitor) shell only: render edge-to-edge with the status bar
// overlaying the WebView and light icons over the dark canvas — consistent
// across every Android version, not just the OS-enforced edge-to-edge on 15+.
// The app's CSS safe-area insets (viewport-fit=cover) keep content clear of the
// notch/cutouts. Entirely tree-shaken out of the web build (no-op there).
import { Capacitor } from "@capacitor/core";
if (Capacitor.isNativePlatform()) {
  import("@capacitor/status-bar")
    .then(({ StatusBar, Style }) => {
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {}); // light icons on dark bg
    })
    .catch(() => {});
}
