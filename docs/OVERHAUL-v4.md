# Tequila Tao — v4 Concept & UI Overhaul

**Goal of this pass:** a returning end-user said *"I'm lost, it's too cryptic, I don't know what to do."* Plus concrete bugs: slider handles invisible (black-on-black), breathing holds too long, and several overlapping/confusable colors.

**Direction (owner-approved):** keep the yin-yang soul and never-shaming philosophy, but make every label plain; one time-aware primary action on Home; collapse to **3 tabs**.

---

## 1. Concept overhaul — from poetic to plain

The philosophy stays (transparent economy, never-shaming, the living disc). What changes is the *language* and *wayfinding*. Every screen now answers "what is this / what do I do?" in words a stressed person reads instantly at 9pm.

### Naming map (visible labels)

| Old (cryptic) | New (plain) | Where |
|---|---|---|
| Center | **Home** | tab + title |
| Balance (separate tab) | merged into **Home** ("How your balance works" expander) | — |
| Clarity Garden / Garden | **Progress** | tab + title |
| Crossroads | **Tonight** (already the title) — now the primary action | flow |
| Stillpoint / "Urge SOS" / "◎" | **Feeling an urge?** → screen "Ride it out" | flow + Home button |
| Send-off | **Log a night out** | flow |
| Clarity (logging) | **Log a clear night** | flow |
| Soft Landing / Recover | **Morning after** | flow |
| Threshold | Welcome splash (unchanged brand) | entry |
| "Hatch your Tao" | **Start** | onboarding CTA |

Route *paths* stay as-is internally (no user value in changing them, avoids regressions); `/balance` redirects to `/home`.

### Navigation — 3 tabs

`Home · Progress · Settings`. The old Center/Balance duplication (same disc, same 4 tiles, same sparkline) is removed by merging Balance's unique value — the **transparent "how it's calculated" breakdown** and the **comeback message** — into Home as collapsible sections.

### Home — one time-aware primary action

Ordered by priority, top to bottom:
1. Greeting + level.
2. The living disc (tap → expands "what this means").
3. Balance read line: *Leaning clear · 78% / target 80%*.
4. **Primary action card** (big, changes by time of day):
   - **Evening/night (17:00–04:59):** "Make tonight's call →" (`/crossroads`)
   - **Morning (05:00–10:59):** if last night was a drink night → "Morning after →" (`/recover`); else "Morning check-in" (mood)
   - **Daytime (11:00–16:59):** check in if not yet; else "Plan tonight"
5. Persistent secondary: **"Feeling an urge? Ride it out →"** (`/urge`) — always one tap away (safety).
6. Mood check-in (if not logged today).
7. Stat tiles (streak, money kept, drinks avoided, urges surfed).
8. Last-7 dots + clarity sparkline.
9. "How your balance works" (collapsible — the transparent economy, from Balance).
10. Mascot quip.

---

## 2. Color system — no overlaps

One hue = one meaning. Removed the green-on-green and salmon-near-red collisions.

| Token | Hex | The one role it owns |
|---|---|---|
| `jade` | `#6fcf97` | clarity / positive / clear night / money kept / success / in-zone / primary button. **The green.** |
| `moonstone` | `#bfd7ea` | calm info accent — drinks avoided, "showed up"/rest, freeze, mood trend. **The blue.** |
| `amber` | `#c8742a` | celebration / yang / night-out path / warm button. **The warm.** |
| `wine` | `#800020` | deep yang gradient base + destructive "Erase all" only. |
| `gold` | `#d4af37` | milestones / patina / achievement only. **The yellow.** |
| `slate` | `#64748b` | paused / slip / drank — neutral, **never red.** **The grey.** |
| `danger` | `#e5484d` (was `#e2604f`) | **medical-safety only** — pushed to a clear red so it can't be mistaken for celebration amber/ember. |

**Retired as semantic accents** (kept only as decorative gradient stops, never as their own meaning): `teal`, `ember`, `amber-deep`, `sage`.

Concrete fixes:
- Garden "clear" tile: `teal` → `jade` (matches "clear" everywhere else).
- Garden "rest/showed up" tile: `sage` green → `moonstone` blue (no longer a third green).
- Crossroads drink card border: `ember` (near-danger salmon) → `amber`.
- `danger` reddened so safety ≠ celebration.
- Money thermometer keeps a `jade→teal` gradient (decorative shade of green, reads as one color).

---

## 3. Slider fix (black-on-black)

**Root cause:** the global reset `button,input,select,textarea { -webkit-appearance:none; appearance:none }` strips the native range thumb; with no custom thumb CSS the handle vanishes into the dark track, and `accent-color` can't render once appearance is stripped.

**Fix:** full custom range styling in `index.css` — light track, jade filled portion (driven by a `--_pct` CSS var set from the component), and a 20px jade thumb with an ink border + shadow. High contrast on the dark glass cards, with a moonstone focus ring. Applies to every slider (urge strength, baseline, target, etc.).

---

## 4. Breathing fix (holds too long)

**Was:** 4-4-4-4 box breathing — both "Hold" phases a full 4s, fixed 4000ms interval, 16s loop.

**Now:** variable per-phase durations, short holds — **Breathe in 4s · Hold 2s · Breathe out 6s · Rest 1s** (13s loop). Driven by chained per-phase timeouts so each phase can have its own length and the disc scales for the phase's duration. The longer exhale is the calming part; holds are brief. Recover's printed guide updated to match ("In 4 · hold 2 · out 6").
