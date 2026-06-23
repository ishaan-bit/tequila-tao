# Tequila Tao — v3.0 Revamp

> **Two forces. One you. Find your balance, one clear night at a time.**
>
> A private, **fully on-device** companion for a more mindful relationship with drinking.
> No accounts. No servers. No tracking. Nothing leaves your phone.

This document is the source of truth for the v3 rebuild. The previous version was a
glitchy, Firebase-coupled prototype with an opaque six-figure point economy; this is a
ground-up redesign grounded in evidence-based behaviour change and a calm, never-shaming
Taoist aesthetic.

---

## 1. Why the rebuild (what was broken)

The old app was "barely usable as a web app." Concretely:

| Problem | Root cause | Fix |
|---|---|---|
| Glitchy styling, missing spacing/colors | **Tailwind v4 never loaded `tailwind.config.js`** (no `@config`), so `min-h-touch`, the `xs:` breakpoint, brand colors, `drop-shadow-glow-*` silently rendered nothing | Moved all tokens to a **CSS-first `@theme`** in `src/index.css`; verified every utility compiles |
| `Bebas Neue` font never rendered | Referenced in components but never loaded | Dropped the shouty "PARTY MODE" type; load only Inter + Playfair Display |
| Tao diagram rendered wrong | A black-on-black yin-yang PNG (`Tao.svg`) disappeared on the dark UI | Replaced with a **live, vector `<YinYang>` component** (area-exact, pin-sharp, animated) |
| `npm run build` **failed** | `manualChunks` was an object (rolldown-vite needs a function) + invalid `react({fastRefresh})` + missing `terser` | Rewrote `vite.config.js`; build is green |
| Broken layout on desktop/wide | 9:16 portrait videos/images with `object-contain` and hard-coded crops | Designed, responsive UI that adapts 360px → desktop |
| Slow, janky load | ~40 MB of eager photos/videos + a 9.6 MB autoplay music file | Hybrid: designed UI is the backbone; cinematic media is **lazy, idle-loaded, optional** |
| Friction & lost data | Forced Google **popup** sign-in (blocked on iOS Safari) + **session-only** persistence | **Removed Firebase Auth entirely.** Fully on-device, works offline |
| Confusing rules | `yin1=150000`, temp-yin `200000`, cents-as-points, asymmetric sigmoid | A **transparent economy** of real-world numbers (streak, money kept, drinks avoided) |
| `h=[100svh]` typo, no route guards, no legal pages | — | Fixed; added guards, Guide, Settings, Privacy, Terms, About |

---

## 2. The product, in one screen

The yin-yang is **not a scoreboard and not a purity meter.**

- **Yin** = clarity, rest, restraint, recovery, money kept, drinks avoided.
- **Yang** = celebration, indulgence, the nights you *choose* to drink.
- A fully-pale circle is **also out of balance** — a thin seed of yang always remains.
  The goal is **mindful agency**, not forced abstinence.
- **Winning** = steering toward *your* self-chosen target ratio (set in onboarding) and
  recovering gracefully from any slip. Never a perfectly white circle.

No shame state exists in the visual or copy vocabulary. A heavy night softens the curve
toward yang gently and the tone stays curious: *"Big night. Let's land it well tomorrow."*

---

## 3. The transparent economy (the "rules")

Every number is legible and auditable — shown live before you confirm, and explained in
full on the **Balance** screen and in the **Guide**.

| Action | Effect |
|---|---|
| **Clear night** (chose not to drink) | +1 streak · + drinks avoided · + money kept · **+3 yin** |
| **Urge surfed** (rode out a craving) | +1 Urges Surfed · before/after intensity logged · **+1 yin** — *the most-rewarded action* |
| **Chose to drink** (logged honestly) | streak **pauses, never zeroes**; best streak preserved; **+1 yang per drink**; harm-reduction kit; lifetime totals untouched |
| **Soft Landing** (morning-after care) | +1 Soft Landing · mood check-in · **+1 yin** (credit is for the *care*, not the drinking) |
| **Daily mood check-in** | paints a Garden tile; keeps the check-in streak alive **even on drink nights** |
| **Milestone** (3/7/14/30/60/100 nights, money thresholds) | one **gold patina arc** on the rim · a single soft bloom · level up: Sprout → Stream → Grove → Mountain → Still Lake |
| **Slip / relapse** | soft **slate**, never red; *"Welcome back, the water's fine"*; lifetime totals **never go down** |

**Streak Freezes:** 2 free per week — a *planned* night needn't even pause your streak.

**Balance math (verbatim, in-app):**
`Yin% = (yinActs + yinSeed) / (yinActs + yinSeed + yangActs + yangSeed)`
where clear night = +3 yin, urge surfed = +1 yin, soft landing = +1 yin, each drink = +1 yang.
The seed is your honest baseline **week**: a 7-night split (≈ `baseline/typicalSession` drinking
nights, the rest clear) scored with those same weights. So a new user **starts from their real
rhythm** — never a fake 50/50, never a hollow 0% — and the calculated start is shown live in
onboarding (disc fill = start, dashed line = target). Real logged events quickly outweigh the
one-week seed. (`baselineSeed` / `startingYinPct` in `src/app/selectors.js`.)

---

## 4. Evidence base

The design deliberately implements mechanisms with research support, and deliberately
**avoids** manipulative "Hook"-style engagement loops (ironic and harmful on a de-addiction app).

- **Self-monitoring** is the single strongest active ingredient in digital alcohol-reduction
  (it *mediated* the effect in the Drink Less RCT) → tracking drinks, money, mood is first-class.
- **Goal-setting** (Drink Less) → onboarding target + per-night previews.
- **Implementation intentions / if-then plans** (meta-analysis: reduces weekly consumption)
  → one "When X, I will Y" plan seeded in onboarding, surfaced at the Crossroads.
- **Urge-surfing / mindfulness** (Marlatt, MBRP): urges crest and pass like waves (~20 min);
  showing the measured intensity drop builds **self-efficacy**, the top predictor of maintained
  change → the Stillpoint tool is the most-rewarded action.
- **Self-compassion over shame** (shame predicts relapse) → no red, no "you failed."
- **Harm reduction** (Dry January benefits accrue even without perfect abstinence; avoid the
  Abstinence-Violation Effect) → streaks pause, never brutally zero; lifetime totals are monotonic.
- **Real motivators** (money saved, drinks avoided, mood/sleep) → surfaced prominently.
- **Gamification that works** (feedback & monitoring, goals, milestones — per systematic reviews),
  via intrinsic Octalysis drives (Epic Meaning, Accomplishment, Ownership) and Fogg's B=MAP
  ("make it tiny, prompt, celebrate immediately"). Streak-freezes counter streak-loss demotivation.

Sources are listed in §11.

---

## 5. Screens & routes

| Route | Name | Purpose |
|---|---|---|
| `/` | Threshold | Splash (no login). Returning users skip to `/home`. Restore-from-backup. |
| `/onboarding` | The Way In | <60s, skippable: intent · honest baseline · target ratio · why + if-then plan |
| `/home` | Center | Living yin-yang, 4 motivators, two actions (Tonight / Morning after), Urge SOS, mood strip |
| `/crossroads` | Crossroads | Tonight's choice — feeling check, intention reminder, two equal paths |
| `/clarity` | Clarity | Bank a clear night (money kept + drinks avoided, live preview) |
| `/sendoff` | Send-off | The drink path — warm, harm-reduction kit, freeze, keep-one-clear-thing |
| `/urge` | Stillpoint | Urge-surf: pre-rating → box-breathing pacer → post-rating drop → outcome |
| `/recover` | Soft Landing | Gentle morning-after checklist + safety card + reflection |
| `/balance` | Balance | Meditative deep-dive with **full rule transparency** |
| `/progress` | Clarity Garden | Heatmap, lifetime totals, money-goal thermometer, urge proof, cards |
| `/settings` | Settings | Edit journey, reminders, feel/motion, **data export/import/wipe**, install PWA |
| `/guide` `/about` `/privacy` `/terms` | — | How it works, philosophy, privacy, terms & care/crisis resources |

`/home /balance /progress /settings` share a safe-area bottom tab bar (`AppShell`). The rest
are full-screen flows. Core routes are guarded behind onboarding.

---

## 6. Architecture

```
src/
  main.jsx              router, route guards, lazy routes, SW registration
  index.css             Tailwind v4 @theme tokens + base/cross-browser CSS
  app/
    store.js            on-device store (localStorage + pub/sub), export/import/wipe
    selectors.js        pure derived stats (streaks, money, yin%, milestones, trends)
    hooks.js            useStore / useProfile / useSettings / useStats (useSyncExternalStore)
    motion.js           useReducedMotion (OS + in-app override), shared transitions
    haptics.js          guarded navigator.vibrate (no-op on iOS)
    sound.js            lazy, OFF-by-default audio cues
    format.js           currency / number / playful equivalences
  components/
    YinYang.jsx         the live SVG centerpiece (area-exact S-curve, target, seeds, patina, breath)
    AppShell.jsx        bottom tab bar layout (safe-area)
    Page.jsx            flow-page wrapper + BackHeader + reduced-motion transitions
    ui.jsx              Button, Card, Counter, MetricTile, Sparkline, MoodPicker, Stepper, Slider, AmountField
    Feedback.jsx        Toast + milestone Bloom (no confetti)
    Mascot.jsx          Tao's dry-but-warm quips
    Markdown.jsx        tiny dependency-free renderer for content pages
    LazyVideo.jsx       idle-loaded cinematic accent (reduced-motion / Save-Data aware)
    InfoPage.jsx        shared layout for Guide/Privacy/Terms/About
  content/legal.js      Guide / Privacy / Terms / About copy
  screens/*             one file per route
docs/design-spec.json   the synthesized design spec this build follows
```

**State model.** The **event log is the single source of truth** (append-only, never mutated
on a slip). Every stat is a **pure derived selector** over the log, so lifetime totals can't
drift and a slip can't erase them. Events:
`clear_night | drink_night | urge_surf | soft_landing | mood_checkin | streak_reset` plus
milestone/freeze metadata. Storage keys: `tt_profile_v1`, `tt_settings_v1`, `tt_events_v1`,
`tt_cards_v1`. Storage degrades gracefully to in-memory if blocked (private mode) and warns the user.

---

## 7. Design system

- **Palette** (warm dark, no pure black/white in chrome): ink `#0B0E1A`→`#141A2E`; pearl
  `#F4F1E8`; jade `#6FCF97` (positive/money); moonstone `#BFD7EA`; wine `#800020`→ember
  `#E07A5F`/amber `#C8742A` (celebration); gold `#D4AF37` (milestones only); slate `#64748B`
  (paused); sage `#7C9A82` (rest); danger reserved **only** for medical-safety warnings.
- **Type:** Playfair Display (display, sparing) + Inter (UI). All numerals `tabular-nums`.
- **Motion:** slow & weighted (`cubic-bezier(.22,.61,.36,1)`, 400–700ms); a single spring for
  the yin-yang divider; a 5s-in/5s-out **breathing** loop that doubles as a calm-down pacer.
  The old 720–1080° full-screen swirls are gone. **Everything routes through `useReducedMotion`.**

---

## 8. Cross-browser, responsive, accessibility, PWA

- `100svh`/`100dvh` (iOS URL-bar safe), `env(safe-area-inset-*)` on all fixed chrome,
  `viewport-fit=cover`, `-webkit-backdrop-filter`.
- Tap targets ≥ 44px; inputs ≥ 16px (no iOS zoom); `inputmode` set; real labels on every control.
- `matchMedia` uses `addEventListener` with an `addListener` fallback; `requestIdleCallback`
  has a `setTimeout` fallback; `navigator.vibrate` is feature-detected (no-op on iOS Safari).
- Video accents are `muted playsInline`, idle-loaded, skipped under reduced-motion / Save-Data,
  with a gradient fallback if autoplay is blocked.
- `role="img"` + live `aria-label` on the yin-yang; focus-visible rings; reduced-motion respected
  globally and per-component. Designed responsive 360px → desktop (centered, `max-w-xl`).
- **PWA:** installable (`manifest.json`, maskable `icon.svg`), offline-first service worker
  (`public/sw.js`) that caches the app shell and deliberately does **not** precache heavy media.
- **Native-ready:** no browser-only assumptions on the critical path; reminders/haptics/file-export
  are structured to swap to Capacitor APIs for the future Android/iOS builds.

---

## 9. Build, run, deploy

```bash
npm install
npm run dev        # local dev
npm run build      # production build → dist/  (currently green)
npm run preview    # serve the built app
npm run lint       # eslint (5 remaining hits are dev-only Fast-Refresh hints)

# Deploy (static hosting on the existing Firebase Hosting project):
npx firebase deploy --only hosting     # requires `firebase login` once
```

`firebase.json` serves `dist/` as an SPA (rewrites to `index.html`) with immutable caching for
hashed assets and `no-cache` for `sw.js`. The Firebase **Auth/Firestore SDK is gone**; only
static Hosting remains.

---

## 10. Roadmap (fast-follow)

Shipped: the full core loop + all required pages. Deliberately deferred:

- **Apothecary** cosmetic shop (disc skins / sound packs) for Clarity Points — scaffolding only.
- Richer collectible **Clarity Cards** with rarities and share-card image export.
- Re-encoded/`WebM` media variants + raster PWA icons (192/512 PNG) generated in CI.
- Capacitor wrap with real local notifications.
- Region-aware crisis-helpline auto-detection.

---

## 11. Sources (evidence base)

- Drink Less smartphone-app RCT (self-monitoring mediates effect): NIHR/NCBI `NBK616724`;
  npj Digital Medicine `s41746-024-01169-7`.
- A-CHESS RCT (smartphone support for alcohol recovery): JAMA Psychiatry / PMC `PMC4016167`.
- Implementation intentions & alcohol — systematic review/meta-analysis: PMC `PMC10087331`.
- Mindfulness / urge-surfing for cravings (MBRP, Marlatt): PMC `PMC4123821`.
- Dry January scoping review (benefits without perfect abstinence): PMC `PMC12415855`.
- Gamification for health behaviour change — systematic reviews: PMC `PMC5073629`, `PMC6617915`.
- Fogg Behavior Model (B=MAP): behaviormodel.org / Stanford Behavior Design Lab.
- Octalysis 8 core drives: yukaichou.com.

*Tequila Tao is a self-help companion, not medical care. Severe alcohol withdrawal can be
dangerous — see a clinician. Crisis resources are in the app's Terms & Guide.*
