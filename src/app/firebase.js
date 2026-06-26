// src/app/firebase.js — lazy Firebase bootstrap.
//
// Firebase is heavy, and the default Tequila Tao experience is fully on-device,
// so we never want to ship it to users who haven't opted into cloud backup/push.
// Every helper here dynamic-imports the specific Firebase module it needs, and
// Vite code-splits those into a separate chunk that's only fetched the first time
// the user turns sync on. Identity is an ANONYMOUS auth user — no email, no PII.
import { firebaseConfig } from "./firebaseConfig.js";

let appPromise = null;
export async function getFirebase() {
  if (!appPromise) {
    appPromise = (async () => {
      const { initializeApp, getApps, getApp } = await import("firebase/app");
      return getApps().length ? getApp() : initializeApp(firebaseConfig);
    })();
  }
  return appPromise;
}

export async function getDb() {
  const app = await getFirebase();
  const { getFirestore } = await import("firebase/firestore");
  return getFirestore(app);
}

// Resolve to a signed-in (anonymous) user, signing in on first call. The
// resulting uid is stable for the lifetime of this install and is what the ops
// console sees as the "device id".
export async function ensureAuth() {
  const app = await getFirebase();
  const { getAuth, signInAnonymously } = await import("firebase/auth");
  const auth = getAuth(app);
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}
