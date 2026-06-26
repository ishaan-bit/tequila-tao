// src/app/cloud.js — OPT-IN cloud backup, restore, and push registration.
//
// This module is the ONLY part of Tequila Tao that ever sends data off the
// device, and it does nothing until the user explicitly turns it on in Settings.
// Design choices that keep it honest for a sobriety app:
//   • Identity is an ANONYMOUS Firebase Auth uid — no email, no phone, no PII.
//   • The backup is addressed by a high-entropy RECOVERY CODE the user keeps, so
//     they can restore on a new phone WITHOUT an account. Knowing the code is the
//     only way to read that backup.
//   • Consent/identity live in their own localStorage key (`tt_cloud_v1`), kept
//     OUT of the synced backup blob so restoring never silently flips sync on for
//     someone else or overwrites a device's own code.
import { useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";
import { getState, subscribe, exportData, importData } from "./store.js";
import { APP_VERSION } from "./version.js";
import { ensureAuth, getDb, getFirebase } from "./firebase.js";
import { VAPID_PUBLIC_KEY } from "./firebaseConfig.js";

const CLOUD_KEY = "tt_cloud_v1";
const DEFAULT = { sync: false, push: false, recoveryCode: null, lastSync: null, pushToken: null };

// ---------- local persistence + pub/sub (separate from the app store) ----------
function load() {
  try {
    const raw = localStorage.getItem(CLOUD_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}
let cloud = load();
const listeners = new Set();
function persist() {
  try {
    localStorage.setItem(CLOUD_KEY, JSON.stringify(cloud));
  } catch {
    /* ignore (private mode) */
  }
}
function set(patch) {
  cloud = { ...cloud, ...patch };
  persist();
  listeners.forEach((l) => l());
}
export function getCloud() {
  return cloud;
}
export function subscribeCloud(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function useCloud() {
  return useSyncExternalStore(subscribeCloud, getCloud, getCloud);
}

// ---------- recovery code ----------
// 16 chars from a 32-symbol, unambiguous alphabet ≈ 80 bits of entropy: not
// guessable/enumerable, so the backup doc can be read by code alone.
function genCode() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  bytes.forEach((b) => (s += A[b % A.length]));
  return s.replace(/(.{4})(?=.)/g, "$1-"); // group as XXXX-XXXX-XXXX-XXXX
}
export function ensureRecoveryCode() {
  if (!cloud.recoveryCode) set({ recoveryCode: genCode() });
  return cloud.recoveryCode;
}

// A lightweight, non-clinical summary for the ops registry. The full data lives
// in the recovery-code-addressed backup, not here.
function deviceSummary() {
  const st = getState();
  const evs = st.events || [];
  return {
    intent: st.profile?.intent || "cutback",
    goalStart: st.profile?.goalStart || null,
    currency: st.profile?.currency || "INR",
    eventCount: evs.length,
    lastEventTs: evs.length ? evs[evs.length - 1].ts : null,
    platform: Capacitor.getPlatform(),
    appVersion: APP_VERSION,
  };
}

// ---------- sync ----------
let syncing = false;
export async function syncNow() {
  if (!cloud.sync || syncing) return;
  syncing = true;
  try {
    const user = await ensureAuth();
    const db = await getDb();
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
    const code = ensureRecoveryCode();
    // 1) device registry doc — keyed by the anonymous uid; this is what the ops
    //    console lists. Metadata only.
    await setDoc(
      doc(db, "devices", user.uid),
      {
        uid: user.uid,
        recoveryCode: code,
        lastSeen: serverTimestamp(),
        push: !!cloud.push,
        pushToken: cloud.pushToken || null,
        ...deviceSummary(),
      },
      { merge: true }
    );
    // 2) the actual backup — addressed by the recovery code (bearer-token read).
    await setDoc(doc(db, "backups", code), {
      uid: user.uid,
      updatedAt: serverTimestamp(),
      data: exportData(),
    });
    set({ lastSync: Date.now() });
  } catch (e) {
    // Best-effort: never throw into a render path. Surfaced via lastSync staleness.
    console.warn("[cloud] sync failed:", e?.message || e);
  } finally {
    syncing = false;
  }
}

export async function enableSync() {
  set({ sync: true });
  ensureRecoveryCode();
  await syncNow();
  return cloud.recoveryCode;
}
export function disableSync() {
  // Stop syncing, but intentionally LEAVE the remote backup intact so the user
  // can still restore later with their code.
  set({ sync: false });
}

// ---------- restore by recovery code ----------
export async function restoreByCode(rawCode, mode = "replace") {
  const code = String(rawCode || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!code) throw new Error("Enter your recovery code.");
  await ensureAuth();
  const db = await getDb();
  const { doc, getDoc } = await import("firebase/firestore");
  const snap = await getDoc(doc(db, "backups", code));
  if (!snap.exists()) throw new Error("No backup found for that code. Double-check it and try again.");
  const payload = snap.data();
  if (!payload?.data) throw new Error("That backup looks empty.");
  importData(payload.data, { mode });
  // Adopt the restored identity's code and keep syncing under it from now on.
  set({ recoveryCode: code, sync: true });
  syncNow();
  return payload.data;
}

// ---------- push (web FCM) ----------
export async function enablePush() {
  if (Capacitor.isNativePlatform()) {
    // Native (Android) push needs @capacitor/push-notifications + google-services.json;
    // wired separately once that file is in place. Record the intent for now.
    set({ push: true });
    if (cloud.sync) await syncNow();
    return { native: true };
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new Error("This browser doesn't support push notifications.");
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error("Push isn't configured yet — a web-push key is still needed.");
  }
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Notifications weren't allowed.");
  const app = await getFirebase();
  const { getMessaging, getToken } = await import("firebase/messaging");
  const messaging = getMessaging(app);
  // Register the FCM worker at a DEDICATED scope so it can't clobber the app's
  // own PWA service worker (sw.js), which controls the root scope.
  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
    scope: "/firebase-cloud-messaging-push-scope",
  });
  const token = await getToken(messaging, { vapidKey: VAPID_PUBLIC_KEY, serviceWorkerRegistration: reg });
  set({ push: true, pushToken: token });
  if (cloud.sync) await syncNow();
  return { token };
}
export function disablePush() {
  set({ push: false, pushToken: null });
  if (cloud.sync) syncNow();
}

// Right-to-erasure: delete this install's cloud backup + registry doc and turn
// sync/push off locally. The Firestore rules let an owner delete their own docs.
export async function deleteCloud() {
  try {
    const user = await ensureAuth();
    const db = await getDb();
    const { doc, deleteDoc } = await import("firebase/firestore");
    if (cloud.recoveryCode) await deleteDoc(doc(db, "backups", cloud.recoveryCode)).catch(() => {});
    await deleteDoc(doc(db, "devices", user.uid)).catch(() => {});
  } catch (e) {
    console.warn("[cloud] delete failed:", e?.message || e);
  } finally {
    set({ sync: false, push: false, pushToken: null });
  }
}

// ---------- auto-sync wiring ----------
let debounceT = 0;
let inited = false;
export function initCloud() {
  if (inited) return;
  inited = true;
  // Debounced backup whenever the on-device log changes — but only while the
  // user has sync enabled (checked at fire time, so toggling works live).
  subscribe(() => {
    if (!cloud.sync) return;
    clearTimeout(debounceT);
    debounceT = setTimeout(syncNow, 4000);
  });
  if (cloud.sync) syncNow(); // launch heartbeat + catch-up backup
}
