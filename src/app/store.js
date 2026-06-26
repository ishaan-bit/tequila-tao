// src/app/store.js
// Fully on-device store. No accounts, no network. Everything lives in
// localStorage. A tiny pub/sub backs React's useSyncExternalStore so the UI
// updates live. Designed to degrade gracefully when storage is unavailable
// (iOS private mode, blocked cookies, etc.) by falling back to memory only.
import { GOALS } from "./selectors.js";

const KEYS = {
  profile: "tt_profile_v1",
  settings: "tt_settings_v1",
  events: "tt_events_v1",
  cards: "tt_cards_v1",
};

export const SCHEMA_VERSION = 1;

// ---------- safe storage ----------
const memoryFallback = new Map();
let storageOK = true;

function rawGet(key) {
  try {
    if (storageOK && typeof localStorage !== "undefined") {
      return localStorage.getItem(key);
    }
  } catch {
    storageOK = false;
  }
  return memoryFallback.has(key) ? memoryFallback.get(key) : null;
}
function rawSet(key, value) {
  memoryFallback.set(key, value);
  try {
    if (storageOK && typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    }
  } catch {
    storageOK = false; // quota / private mode — keep working from memory
  }
}
function rawRemove(key) {
  memoryFallback.delete(key);
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function isPersistent() {
  return storageOK;
}

// ---------- defaults ----------
export const DEFAULT_PROFILE = {
  onboarded: false,
  tourSeen: false, // first-launch how-to overlay (shown once on Home)
  permsAsked: false, // first-run notifications + backup consent shown once
  intent: "cutback", // 'cutback' | 'break' | 'quit' — drives the whole experience
  goalStart: null, // ms timestamp the current goal began (anchors sober-day count)
  breakDays: 30, // length of a "take a break" challenge (only used when intent==='break')
  currency: "INR",
  drinksPerWeekBaseline: 8,
  spendPerNight: 1200,
  typicalSession: 3, // drinks per night out
  targetYinRatio: 0.8, // alcohol-free-nights target (cutback ~0.8; break/quit = 1)
  rewardGoal: { label: "a weekend away", amount: 10000 },
  intention: {
    trigger: "friends order another round",
    plan: "order a soda & lime and call it",
  },
  schemaVersion: SCHEMA_VERSION,
};

export const DEFAULT_SETTINGS = {
  sound: false, // OFF by default (calm, respectful)
  haptics: true,
  reducedMotionOverride: false, // force-on reduced motion
  reminderTime: "21:00", // 'HH:MM' — the daily check-in nudge time (installed app)
  dailyReminder: true, // master switch for the daily on-device reminder
  drinkLimitNudge: true,
};

// ---------- in-memory state mirror ----------
function parse(json, fallback) {
  if (!json) return fallback;
  try {
    const v = JSON.parse(json);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

function hydrate() {
  return {
    profile: { ...DEFAULT_PROFILE, ...parse(rawGet(KEYS.profile), {}) },
    settings: { ...DEFAULT_SETTINGS, ...parse(rawGet(KEYS.settings), {}) },
    events: parse(rawGet(KEYS.events), []) || [],
    cards: parse(rawGet(KEYS.cards), []) || [],
  };
}

let state = hydrate();
const listeners = new Set();

function emit() {
  // new top-level identity so useSyncExternalStore sees a change
  state = { ...state };
  listeners.forEach((l) => l());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function getState() {
  return state;
}

// ---------- ids ----------
// A monotonic per-session counter guarantees the fallback id is unique even for
// two events in the same millisecond (otherwise import's dedupe-by-id could drop
// a legitimate event).
let seq = 0;
function uid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `e_${Date.now().toString(36)}_${(seq++).toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}

// Known event types — used to validate imported backups so a hand-edited or
// corrupted file can't poison the derived stats with unknown/garbage events.
export const EVENT_TYPES = new Set([
  "clear_night",
  "drink_night",
  "urge_surf",
  "soft_landing",
  "mood_checkin",
  "milestone",
  "freeze_used",
  "streak_reset",
]);

// ---------- writers ----------
export function updateProfile(patch) {
  state.profile = { ...state.profile, ...patch, schemaVersion: SCHEMA_VERSION };
  rawSet(KEYS.profile, JSON.stringify(state.profile));
  emit();
  return state.profile;
}

/**
 * Set (or switch) the user's goal. Applies that goal's sensible defaults —
 * abstinence goals (break/quit) aim at 100% and a "take a break" gets its day
 * count — and stamps a fresh `goalStart` so the sober-day countdown restarts
 * from the moment they commit. Research backs letting people change goals: many
 * begin at moderation and migrate to abstinence (or restart a break) over time.
 * `extra` lets callers override (e.g. a chosen break length or kept target).
 */
export function setGoal(intent, extra = {}) {
  const g = GOALS[intent] || GOALS.cutback;
  const patch = {
    intent,
    goalStart: Date.now(),
    targetYinRatio: g.defaultTarget,
    ...(g.breakDays ? { breakDays: g.breakDays } : {}),
    ...extra,
  };
  return updateProfile(patch);
}

export function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  rawSet(KEYS.settings, JSON.stringify(state.settings));
  emit();
  return state.settings;
}

/**
 * Append an immutable event to the log. The log is the single source of truth;
 * all stats are derived (see selectors.js). Events are never mutated/deleted on
 * a slip — that is what keeps lifetime totals monotonic.
 *
 * type: 'clear_night' | 'drink_night' | 'urge_surf' | 'soft_landing'
 *     | 'mood_checkin' | 'milestone' | 'freeze_used' | 'streak_reset'
 */
export function addEvent(type, payload = {}, ts = Date.now()) {
  const event = { id: uid(), ts, type, payload };
  state.events = [...state.events, event];
  rawSet(KEYS.events, JSON.stringify(state.events));
  emit();
  return event;
}

/**
 * Remove an event by id. This is the basis of the in-app "Undo" affordance and
 * same-day correction (a mis-tapped "I drank" must be reversible — a permanent
 * mistake breaking a hard-won streak is exactly the kind of shame spiral this app
 * exists to prevent). It is NOT a way to erase a real slip to protect totals: the
 * UI scopes it to the entry you just made (or that day's entry you're replacing),
 * never to old history. Because every stat is a pure selector over the log,
 * removing an event restores the previous numbers exactly.
 */
export function removeEvent(id) {
  if (!id) return false;
  const before = state.events.length;
  state.events = state.events.filter((e) => e.id !== id);
  if (state.events.length === before) return false;
  rawSet(KEYS.events, JSON.stringify(state.events));
  emit();
  return true;
}

export function awardCard(card) {
  // card: { key, name, rarity, flavor, ts }
  if (state.cards.some((c) => c.key === card.key && card.unique)) return null;
  const withTs = { ts: Date.now(), ...card };
  state.cards = [...state.cards, withTs];
  rawSet(KEYS.cards, JSON.stringify(state.cards));
  emit();
  return withTs;
}

// ---------- data ownership ----------
export function exportData() {
  return {
    app: "tequila-tao",
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    profile: state.profile,
    settings: state.settings,
    events: state.events,
    cards: state.cards,
  };
}

const DAY_MS = 86400000;

// Only let well-formed events into the log: a corrupted or hand-edited backup
// with a string/null/future ts could NaN-poison firstTs and silently zero or
// truncate every streak. Future-dated events are rejected too (clock skew).
function validEvent(e) {
  return (
    e &&
    typeof e === "object" &&
    typeof e.id === "string" &&
    Number.isFinite(e.ts) &&
    e.ts <= Date.now() + DAY_MS &&
    EVENT_TYPES.has(e.type)
  );
}

/**
 * Restore a backup. `mode`:
 *   • "replace" — the backup becomes the device's state (events/profile/settings/
 *     cards taken from the file). Use when restoring onto a device with existing
 *     data the user wants overwritten.
 *   • "merge" (default) — union the backup's events into the current log
 *     (de-duped by id), and de-dupe cards by key. Profile/settings from the file
 *     win when present. Use to combine two devices.
 * Throws (with a friendly message the callers surface) on a non-backup or a
 * backup from a newer schema we can't safely read.
 */
export function importData(obj, { mode = "merge" } = {}) {
  if (!obj || typeof obj !== "object" || obj.app !== "tequila-tao") {
    throw new Error("That file didn't look like a Tequila Tao backup.");
  }
  if (Number(obj.schemaVersion) > SCHEMA_VERSION) {
    throw new Error("This backup is from a newer version of the app. Update first, then restore.");
  }

  const fileEvents = (Array.isArray(obj.events) ? obj.events : []).filter(validEvent);

  if (mode === "replace") {
    state.events = fileEvents.slice().sort((a, b) => a.ts - b.ts);
    state.profile = { ...DEFAULT_PROFILE, ...(obj.profile || {}) };
    state.settings = { ...DEFAULT_SETTINGS, ...(obj.settings || {}) };
    state.cards = dedupeCards(Array.isArray(obj.cards) ? obj.cards : []);
  } else {
    // merge — de-dupe events by id, cards by key
    const seen = new Set();
    state.events = [...state.events, ...fileEvents]
      .filter((e) => {
        if (!e || !e.id || seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      })
      .sort((a, b) => a.ts - b.ts);
    if (obj.profile) state.profile = { ...DEFAULT_PROFILE, ...obj.profile };
    if (obj.settings) state.settings = { ...DEFAULT_SETTINGS, ...obj.settings };
    state.cards = dedupeCards([...(state.cards || []), ...(Array.isArray(obj.cards) ? obj.cards : [])]);
  }

  rawSet(KEYS.events, JSON.stringify(state.events));
  rawSet(KEYS.profile, JSON.stringify(state.profile));
  rawSet(KEYS.settings, JSON.stringify(state.settings));
  rawSet(KEYS.cards, JSON.stringify(state.cards));
  emit();
}

function dedupeCards(cards) {
  const seen = new Set();
  return cards.filter((c) => {
    if (!c || !c.key || seen.has(c.key)) return false;
    seen.add(c.key);
    return true;
  });
}

/** Soft reset: start the clear-night streak over but keep all lifetime history. */
export function softResetStreak(note = "") {
  return addEvent("streak_reset", { note });
}

/** Nuke everything (double-confirmed in the UI). */
export function clearAll() {
  Object.values(KEYS).forEach(rawRemove);
  state = {
    profile: { ...DEFAULT_PROFILE },
    settings: { ...DEFAULT_SETTINGS },
    events: [],
    cards: [],
  };
  emit();
}
