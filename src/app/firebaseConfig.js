// src/app/firebaseConfig.js — public Firebase web config for the `tequila-tao`
// project.
//
// NOTE: a Firebase web `apiKey` is NOT a secret. It only identifies the project
// to Google's servers; it grants no access on its own. All access is enforced by
// Firestore Security Rules + Firebase Auth. It is expected and safe to ship this
// in client code. (See Firebase docs: "Is it safe to expose Firebase config?")
export const firebaseConfig = {
  apiKey: "AIzaSyBKrCckFoR_CbQPAGScoZCwqgAI81MzDa0",
  authDomain: "tequila-tao.firebaseapp.com",
  projectId: "tequila-tao",
  storageBucket: "tequila-tao.firebasestorage.app",
  messagingSenderId: "98857517217",
  appId: "1:98857517217:web:7144c1768c4f1809d270e0",
};

// FCM Web-Push public VAPID key. Generate it in the Firebase Console →
// Project settings → Cloud Messaging → "Web Push certificates" → Generate key
// pair, then paste the PUBLIC key here. While this is empty, web push-token
// registration is skipped (the app still works; it just can't receive web push).
export const VAPID_PUBLIC_KEY = "BHugJ5mNeRYyOy-jABCAlc4GuGZTOm5xR6lNO6KLfN6HGb1yG32K2U6_b6rvq8jpvv6fEvrVgZRGPYTf3FhMuo0";
