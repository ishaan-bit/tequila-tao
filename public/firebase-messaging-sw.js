// public/firebase-messaging-sw.js
// Handles FCM Web push while the PWA is backgrounded or closed. It is registered
// at the dedicated scope /firebase-cloud-messaging-push-scope (see cloud.js) so
// it never takes over the app's offline service worker (sw.js, root scope). This
// is web-only; the installed Android app uses native FCM once google-services.json
// is configured.
importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBKrCckFoR_CbQPAGScoZCwqgAI81MzDa0",
  authDomain: "tequila-tao.firebaseapp.com",
  projectId: "tequila-tao",
  storageBucket: "tequila-tao.firebasestorage.app",
  messagingSenderId: "98857517217",
  appId: "1:98857517217:web:7144c1768c4f1809d270e0",
});

firebase.messaging().onBackgroundMessage((payload) => {
  const n = (payload && payload.notification) || {};
  self.registration.showNotification(n.title || "Tequila Tao", {
    body: n.body || "",
    tag: "tequila-tao",
  });
});
