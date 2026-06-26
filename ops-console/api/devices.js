// GET /api/devices
// Verify admin → read the `devices` collection (most-recently-seen first,
// capped at 500) → return an array of device docs with Timestamps converted
// to ISO strings / millis.

import { admin, requireAdmin, tsToParts } from './_lib/admin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const decoded = await requireAdmin(req, res);
  if (!decoded) return; // response already written

  try {
    const snap = await admin
      .firestore()
      .collection('devices')
      .orderBy('lastSeen', 'desc')
      .limit(500)
      .get();

    const devices = snap.docs.map((doc) => {
      const d = doc.data() || {};
      const lastSeen = tsToParts(d.lastSeen);
      return {
        id: doc.id,
        uid: d.uid ?? doc.id,
        recoveryCode: d.recoveryCode ?? null,
        lastSeen: lastSeen.iso,
        lastSeenMillis: lastSeen.millis,
        push: d.push === true,
        pushToken: d.pushToken ?? null,
        hasPushToken: !!d.pushToken,
        intent: d.intent ?? null,
        goalStart: d.goalStart ?? null,
        currency: d.currency ?? null,
        eventCount: typeof d.eventCount === 'number' ? d.eventCount : 0,
        lastEventTs: d.lastEventTs ?? null,
        platform: d.platform ?? null,
        appVersion: d.appVersion ?? null,
      };
    });

    res.status(200).json({ devices, count: devices.length });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to read devices', detail: String(err && err.message) });
  }
}
