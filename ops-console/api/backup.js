// GET /api/backup?uid=...
// Verify admin → read devices/{uid} → use its recoveryCode → read
// backups/{recoveryCode} → return { device, data }.
// The UI shows a summary and lets the admin download the backup JSON.

import { admin, requireAdmin, tsToParts } from './_lib/admin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const decoded = await requireAdmin(req, res);
  if (!decoded) return;

  const uid = (req.query && req.query.uid) || '';
  if (!uid || typeof uid !== 'string') {
    res.status(400).json({ error: 'Missing uid query param' });
    return;
  }

  try {
    const db = admin.firestore();

    const deviceSnap = await db.collection('devices').doc(uid).get();
    if (!deviceSnap.exists) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    const deviceData = deviceSnap.data() || {};
    const recoveryCode = deviceData.recoveryCode;

    const deviceLastSeen = tsToParts(deviceData.lastSeen);
    const device = {
      id: deviceSnap.id,
      uid: deviceData.uid ?? deviceSnap.id,
      recoveryCode: recoveryCode ?? null,
      platform: deviceData.platform ?? null,
      appVersion: deviceData.appVersion ?? null,
      intent: deviceData.intent ?? null,
      eventCount:
        typeof deviceData.eventCount === 'number' ? deviceData.eventCount : 0,
      lastSeen: deviceLastSeen.iso,
      lastSeenMillis: deviceLastSeen.millis,
    };

    if (!recoveryCode) {
      res
        .status(200)
        .json({ device, data: null, updatedAt: null, note: 'Device has no recoveryCode' });
      return;
    }

    const backupSnap = await db.collection('backups').doc(recoveryCode).get();
    if (!backupSnap.exists) {
      res
        .status(200)
        .json({ device, data: null, updatedAt: null, note: 'No backup document for this recoveryCode' });
      return;
    }

    const backup = backupSnap.data() || {};
    const updatedAt = tsToParts(backup.updatedAt);

    res.status(200).json({
      device,
      backupUid: backup.uid ?? null,
      updatedAt: updatedAt.iso,
      updatedAtMillis: updatedAt.millis,
      data: backup.data ?? null,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to read backup', detail: String(err && err.message) });
  }
}
