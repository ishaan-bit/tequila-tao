# Tequila Tao · Ops Console

A private admin console for the Tequila Tao maintainer. It lets you:

1. **Browse the device registry** — every app install (a `devices` doc keyed by anonymous Firebase Auth uid).
2. **Send push notifications** — to a single device or broadcast to all.
3. **View / export a device's cloud backup** — read `backups/{recoveryCode}` and download the full JSON.

It talks to the **existing** Firebase project `tequila-tao`. There are **no Cloud Functions and no Blaze plan**: all privileged work (Firestore reads, FCM sends) happens in **Vercel serverless functions** using `firebase-admin` with a service-account key. The browser only uses Firebase for **admin Google sign-in**.

---

## Architecture

```
Browser (Vite + React 19 SPA)
  └─ Firebase Auth (Google sign-in only) ──► gets a Firebase ID token
  └─ fetch('/api/...', { Authorization: 'Bearer <idToken>' })
        │
        ▼
Vercel serverless functions  (ops-console/api/*.js)
  └─ verify ID token  (admin.auth().verifyIdToken)
  └─ check email ∈ ADMIN_EMAILS         ◄── the REAL security boundary
  └─ firebase-admin  ──► Firestore (devices, backups) + FCM
        │
        ▼
Firebase project: tequila-tao
```

The client-side allowlist (`VITE_ADMIN_EMAILS`) only controls what UI is shown — it is **cosmetic**. Authorization is enforced server-side on every API call.

> **Firestore rules:** no changes needed. The Firebase **Admin SDK bypasses Firestore security rules**, so the serverless functions can read `devices` / `backups` regardless of how your client-facing rules are written.

---

## Project layout

```
ops-console/
├─ api/
│  ├─ _lib/admin.js     # firebase-admin init + requireAdmin() guard + helpers
│  ├─ devices.js        # GET  /api/devices
│  ├─ send-push.js      # POST /api/send-push
│  └─ backup.js         # GET  /api/backup?uid=...
├─ public/
│  └─ icon.png          # webpush + favicon icon (replace with a real one)
├─ src/
│  ├─ components/
│  │  ├─ DevicesTable.jsx
│  │  ├─ DeviceDetail.jsx
│  │  └─ PushForm.jsx
│  ├─ api.js            # fetch wrapper, attaches Bearer token
│  ├─ firebase.js       # client Firebase Auth init
│  ├─ utils.js          # formatting / clipboard / download helpers
│  ├─ App.jsx           # sign-in gate + console shell
│  ├─ main.jsx
│  └─ styles.css        # dark theme
├─ .env.example
├─ vercel.json
├─ vite.config.js
└─ package.json
```

---

## Environment variables

Copy `.env.example` → `.env.local` for local dev. In production, set these in the
**Vercel dashboard → Settings → Environment Variables**.

### Client (Vite) — public, safe to expose

| Variable | Purpose |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Firebase web config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase web config |
| `VITE_FIREBASE_PROJECT_ID` | Firebase web config |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase web config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase web config |
| `VITE_FIREBASE_APP_ID` | Firebase web config |
| `VITE_ADMIN_EMAILS` | Comma-separated admin emails. **UX gating only.** |

### Server (serverless functions) — secret

| Variable | Purpose |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | **Full service-account key JSON, as a single-line string.** Used to init `firebase-admin`. |
| `ADMIN_EMAILS` | Comma-separated admin emails. **The real security boundary** — every API request is rejected unless the verified Google token's email is in this list. |

### How to get `FIREBASE_SERVICE_ACCOUNT`

1. Firebase console → your project (`tequila-tao`) → **Project settings** (gear icon).
2. **Service accounts** tab → **Generate new private key** → confirm. A JSON file downloads.
3. Open the file and copy its **entire contents**.
4. Paste it as the value of `FIREBASE_SERVICE_ACCOUNT`.
   - In the Vercel dashboard you can paste the multi-line JSON directly into the value box.
   - In a local `.env.local`, put it on **one line** (the embedded `\n` inside `private_key` should stay as the literal two characters `\` `n` — `JSON.parse` handles them).
   - **Never commit this file or value.** `.gitignore` already excludes `.env*` and `serviceAccount*.json`.

> Treat the service-account key like a root password: it grants full admin access to the Firebase project.

---

## Local development

```bash
cd ops-console
npm install
```

### Option A — full stack with the API (recommended)

The `api/*` functions only run under Vercel's runtime, so use the Vercel CLI:

```bash
npm i -g vercel        # if you don't have it
vercel link            # link to your Vercel project (first time only)
vercel dev             # serves the SPA + /api on http://localhost:3000
```

`vercel dev` reads env vars from your linked Vercel project, or from a local
`.env.local`. Make sure all the vars above are present.

### Option B — UI only (no API)

```bash
npm run dev            # Vite dev server, http://localhost:5173
```

Sign-in works, but `/api/*` calls will 404 because the serverless functions
aren't running. Use this only for styling/UI work.

### Build

```bash
npm run build          # outputs to dist/
npm run preview        # preview the production build
```

---

## Deploy (Vercel)

1. Push this `ops-console/` directory to a repo (or set it as the Vercel
   project's **Root Directory** if it lives inside a monorepo).
2. In the Vercel project settings, add **all** env vars from the tables above
   (both `VITE_*` and the server secrets).
3. Deploy:

```bash
vercel --prod
```

`vercel.json` already configures:
- the `api/*.js` functions (Node 20 runtime),
- SPA rewrites (everything except `/api/*` → `index.html`).

### Firebase Auth authorized domains

For Google sign-in to work on the deployed site, add your Vercel domain to
**Firebase console → Authentication → Settings → Authorized domains**
(e.g. `your-app.vercel.app`). `localhost` is allowed by default.

---

## API reference

All endpoints require `Authorization: Bearer <Firebase ID token>` and an email
in `ADMIN_EMAILS`. Otherwise they return `401` (bad/missing token) or `403`
(not allowlisted).

### `GET /api/devices`
Returns up to 500 devices, newest `lastSeen` first.
```json
{ "count": 2, "devices": [ { "uid": "...", "platform": "android", "intent": "quit",
  "eventCount": 14, "lastSeen": "2026-06-26T...Z", "hasPushToken": true, ... } ] }
```

### `POST /api/send-push`
Body: `{ "uid"?: string, "broadcast"?: boolean, "title": string, "body": string }`.
Resolves target `pushToken`(s) and sends via `admin.messaging().sendEach`.
```json
{ "ok": true, "mode": "broadcast", "requested": 12, "successCount": 11,
  "failureCount": 1, "invalidTokens": [ { "uid": "abc123", "code": "messaging/registration-token-not-registered" } ],
  "results": [ ... ] }
```
Dead/expired tokens are reported (not auto-deleted).

### `GET /api/backup?uid=...`
Reads `devices/{uid}` → `recoveryCode` → `backups/{recoveryCode}`.
```json
{ "device": { ... }, "updatedAt": "2026-06-26T...Z", "data": { "app": "...",
  "schemaVersion": 1, "events": [ ... ], "cards": [ ... ], "profile": { ... } } }
```

---

## Notes

- Replace `public/icon.png` with a real app icon (it's used as the webpush
  notification icon and the favicon). A 1×1 placeholder ships by default.
- The console performs **no writes** to Firestore — it only reads devices /
  backups and sends FCM messages.
- `noindex` is set so the console isn't indexed by search engines.
