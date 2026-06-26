// Firebase JS SDK — used ONLY for admin Google sign-in on the client.
// No Firestore access happens from the browser; all data goes through the
// serverless API (which uses firebase-admin and the real allowlist).

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';

// The web config is public (it only identifies the project — access is gated by
// the serverless API's admin check). Fall back to the known tequila-tao values so
// the console loads even before VITE_* env vars are set in Vercel.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBKrCckFoR_CbQPAGScoZCwqgAI81MzDa0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tequila-tao.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tequila-tao",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tequila-tao.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "98857517217",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:98857517217:web:7144c1768c4f1809d270e0",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}

export function signOut() {
  return fbSignOut(auth);
}

export { onAuthStateChanged };

// Comma-separated client allowlist — UX gating only.
export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'kumar.ishaan93@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAllowlisted(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
