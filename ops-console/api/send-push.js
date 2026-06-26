// POST /api/send-push
// Body: { uid?: string, uids?: string[], broadcast?: boolean, title, body }
//
// Verify admin → resolve target tokens:
//   - uid       : read that one device's pushToken.
//   - uids      : read pushTokens for that specific (filtered) set of devices.
//   - broadcast : gather all non-null pushTokens from `devices` (cap 500).
// Send via admin.messaging().sendEach([...]) and report per-token results,
// surfacing invalid/expired tokens so the admin can see them.

import { admin, requireAdmin, readJsonBody } from './_lib/admin.js';

// FCM error codes that mean "this token is dead, stop using it".
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const decoded = await requireAdmin(req, res);
  if (!decoded) return;

  const body = await readJsonBody(req);
  const { uid, broadcast } = body || {};
  const uids = Array.isArray(body && body.uids)
    ? body.uids.filter((u) => typeof u === 'string' && u)
    : null;
  const title = (body && body.title ? String(body.title) : '').trim();
  const messageBody = (body && body.body ? String(body.body) : '').trim();

  if (!title || !messageBody) {
    res.status(400).json({ error: 'Both "title" and "body" are required' });
    return;
  }
  if (!uid && !broadcast && !(uids && uids.length)) {
    res
      .status(400)
      .json({ error: 'Provide "uid", "uids", or "broadcast: true"' });
    return;
  }
  if (uids && uids.length > 500) {
    res.status(400).json({ error: 'Too many uids (max 500 per send)' });
    return;
  }

  try {
    const db = admin.firestore();

    // ---- Resolve target tokens (track which device each token belongs to) ----
    /** @type {{ token: string, uid: string }[]} */
    const targets = [];

    if (broadcast) {
      const snap = await db
        .collection('devices')
        .orderBy('lastSeen', 'desc')
        .limit(500)
        .get();
      for (const doc of snap.docs) {
        const t = doc.data() && doc.data().pushToken;
        if (t) targets.push({ token: t, uid: doc.id });
      }
    } else if (uids && uids.length) {
      // Filtered audience: fetch each named device and collect its token.
      const snaps = await db.getAll(
        ...uids.map((u) => db.collection('devices').doc(u))
      );
      for (const doc of snaps) {
        if (!doc.exists) continue;
        const t = doc.data() && doc.data().pushToken;
        if (t) targets.push({ token: t, uid: doc.id });
      }
    } else {
      const doc = await db.collection('devices').doc(uid).get();
      if (!doc.exists) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }
      const t = doc.data() && doc.data().pushToken;
      if (t) targets.push({ token: t, uid: doc.id });
    }

    if (targets.length === 0) {
      res.status(200).json({
        ok: true,
        requested: 0,
        successCount: 0,
        failureCount: 0,
        invalidTokens: [],
        results: [],
        note: 'No registered push tokens for the selected target(s).',
      });
      return;
    }

    // ---- Build and send messages ----
    const notification = { title, body: messageBody };
    const messages = targets.map((t) => ({
      token: t.token,
      notification,
      webpush: {
        notification: {
          icon: '/icon.png',
        },
        fcmOptions: {},
      },
    }));

    const batchResponse = await admin.messaging().sendEach(messages);

    let successCount = 0;
    let failureCount = 0;
    const invalidTokens = [];
    const results = batchResponse.responses.map((r, i) => {
      const target = targets[i];
      if (r.success) {
        successCount += 1;
        return { uid: target.uid, success: true, messageId: r.messageId };
      }
      failureCount += 1;
      const code = r.error && r.error.code;
      const dead = code && DEAD_TOKEN_CODES.has(code);
      if (dead) {
        invalidTokens.push({ uid: target.uid, code });
      }
      return {
        uid: target.uid,
        success: false,
        code: code || 'unknown',
        message: (r.error && r.error.message) || 'send failed',
        deadToken: !!dead,
      };
    });

    res.status(200).json({
      ok: true,
      mode: broadcast ? 'broadcast' : 'single',
      requested: targets.length,
      successCount,
      failureCount,
      invalidTokens,
      results,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to send push', detail: String(err && err.message) });
  }
}
