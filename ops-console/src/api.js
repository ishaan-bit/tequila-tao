// Thin client for the serverless API. Attaches the current Firebase ID token
// as `Authorization: Bearer <idToken>` on every request.

import { auth } from './firebase.js';

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function parse(res) {
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const msg =
      (payload && (payload.error || payload.detail)) ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

export async function fetchDevices() {
  const headers = await authHeaders();
  const res = await fetch('/api/devices', { headers });
  return parse(res);
}

export async function fetchBackup(uid) {
  const headers = await authHeaders();
  const res = await fetch(`/api/backup?uid=${encodeURIComponent(uid)}`, {
    headers,
  });
  return parse(res);
}

export async function sendPush({ uid, uids, broadcast, title, body }) {
  const headers = {
    ...(await authHeaders()),
    'Content-Type': 'application/json',
  };
  const res = await fetch('/api/send-push', {
    method: 'POST',
    headers,
    body: JSON.stringify({ uid, uids, broadcast, title, body }),
  });
  return parse(res);
}
