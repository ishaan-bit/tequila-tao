// Shared helpers for the serverless API: firebase-admin init, auth guard,
// timestamp conversion. Imported by every handler in `api/`.
//
// Security model:
//   - firebase-admin is initialized from the FIREBASE_SERVICE_ACCOUNT env var
//     (a JSON string of a service-account key). The admin SDK bypasses
//     Firestore security rules, so no rule changes are needed.
//   - Every request must carry `Authorization: Bearer <Firebase ID token>`.
//   - We verify the token, then require the decoded email to be in the
//     server-side ADMIN_EMAILS allowlist. This is the real security boundary.

import admin from 'firebase-admin';

// ---------------------------------------------------------------------------
// One-time initialization (guarded against re-init across warm invocations).
// ---------------------------------------------------------------------------
function getAdminApp() {
  if (admin.apps.length) return admin.app();

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT env var is not set. ' +
        'Paste the full service-account JSON into it.'
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT is not valid JSON: ' + err.message
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Eager, idempotent init so `admin.firestore()` / `admin.messaging()` work.
getAdminApp();

export { admin };

// ---------------------------------------------------------------------------
// Admin allowlist (server-side, the authoritative check).
// ---------------------------------------------------------------------------
export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Auth guard. Returns the decoded token on success.
// On failure it writes the HTTP response and returns null — callers must
// `return` immediately when this returns null.
// ---------------------------------------------------------------------------
export async function requireAdmin(req, res) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    res.status(401).json({ error: 'Missing Authorization: Bearer <idToken>' });
    return null;
  }

  const idToken = match[1].trim();
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }

  const email = (decoded.email || '').toLowerCase();
  const allow = getAdminEmails();
  if (allow.length === 0) {
    res
      .status(403)
      .json({ error: 'Server misconfigured: ADMIN_EMAILS is empty' });
    return null;
  }
  if (!email || !allow.includes(email)) {
    res.status(403).json({ error: 'Not authorized' });
    return null;
  }

  return decoded;
}

// ---------------------------------------------------------------------------
// Convert a value that may be a Firestore Timestamp to { iso, millis }.
// Leaves plain numbers / nulls alone but also surfaces them as millis.
// ---------------------------------------------------------------------------
export function tsToParts(value) {
  if (value == null) return { iso: null, millis: null };

  // Firestore Timestamp (admin SDK) has toMillis()/toDate().
  if (typeof value.toMillis === 'function') {
    const millis = value.toMillis();
    return { iso: new Date(millis).toISOString(), millis };
  }
  // Already a JS Date.
  if (value instanceof Date) {
    return { iso: value.toISOString(), millis: value.getTime() };
  }
  // Epoch millis number.
  if (typeof value === 'number') {
    return { iso: new Date(value).toISOString(), millis: value };
  }
  // Unknown shape — pass through as-is under iso for visibility.
  return { iso: null, millis: null };
}

// Read the JSON body in a way that works on both Vercel (req.body parsed)
// and raw Node streams (vercel dev edge cases).
export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  // Fall back to reading the stream.
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}
