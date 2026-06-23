# Tequila Tao

> Two forces. One you. Find your balance, one clear night at a time.

A private, **fully on-device** companion for a more mindful relationship with drinking —
built on the Taoist yin-yang as a living portrait of your balance. No accounts, no servers,
no tracking. Works offline. Installable as a PWA and structured to ship as Android/iOS later.

**→ Full design & engineering write-up: [REVAMP.md](./REVAMP.md)**

## Quick start

```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # serve the built app
npm run lint
```

## Stack

React 19 · Vite (rolldown-vite) · Tailwind v4 (CSS-first `@theme`) · Framer Motion ·
react-router-dom v7 · on-device storage (localStorage). No backend.

## The idea in one line

Yin = clarity/recovery/restraint; Yang = celebration. The win isn't a perfectly white
circle — it's steering toward *your* chosen balance and coming back gracefully after any
slip. Transparent rules (streak, money kept, drinks avoided, urges surfed), never-shaming
tone, evidence-based mechanisms (self-monitoring, if-then plans, urge-surfing, harm reduction).

## Deploy

Static hosting on Firebase Hosting:

```bash
npx firebase deploy --only hosting   # requires `firebase login` once
```

## Safety

Tequila Tao is a self-help tool, **not medical care**. Severe alcohol withdrawal can be
dangerous — please see a clinician. Crisis resources are inside the app (Settings → Terms & care).
