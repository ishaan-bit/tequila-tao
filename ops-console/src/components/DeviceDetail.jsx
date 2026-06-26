import { useState, useEffect } from 'react';
import { fetchBackup } from '../api.js';
import PushForm from './PushForm.jsx';
import {
  fullDate,
  relativeTime,
  copyToClipboard,
  downloadJson,
  summarizeEvents,
} from '../utils.js';

export default function DeviceDetail({ device, onToast, onClose }) {
  const [backup, setBackup] = useState(null);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [backupError, setBackupError] = useState(null);

  // Reset backup view whenever the selected device changes.
  useEffect(() => {
    setBackup(null);
    setBackupError(null);
    setLoadingBackup(false);
  }, [device.id]);

  async function loadBackup() {
    setLoadingBackup(true);
    setBackupError(null);
    try {
      const res = await fetchBackup(device.uid);
      setBackup(res);
    } catch (e) {
      setBackupError(e.message || 'Failed to load backup');
    } finally {
      setLoadingBackup(false);
    }
  }

  async function copy(text, label) {
    const ok = await copyToClipboard(text);
    if (onToast) onToast(ok ? `${label} copied` : 'Copy failed');
  }

  const data = backup && backup.data;
  const evSummary = data ? summarizeEvents(data.events) : null;
  const profile = data && data.profile;

  return (
    <div className="card detail">
      <div className="card-head">
        <h2>Device detail</h2>
        <button className="ghost" onClick={onClose} title="Close">
          ✕
        </button>
      </div>
      <div className="card-body">
        <dl className="kv">
          <dt>UID</dt>
          <dd>
            <span
              className="mono copyable"
              onClick={() => copy(device.uid, 'UID')}
              title="Click to copy"
            >
              {device.uid}
            </span>
          </dd>
          <dt>Recovery</dt>
          <dd>
            {device.recoveryCode ? (
              <span
                className="mono copyable"
                onClick={() => copy(device.recoveryCode, 'Recovery code')}
                title="Click to copy"
              >
                {device.recoveryCode}
              </span>
            ) : (
              <span className="muted">—</span>
            )}
          </dd>
          <dt>Platform</dt>
          <dd>
            {device.platform || '—'}
            {device.appVersion ? ` · v${device.appVersion}` : ''}
          </dd>
          <dt>Goal</dt>
          <dd>{device.intent || '—'}</dd>
          <dt>Currency</dt>
          <dd>{device.currency || '—'}</dd>
          <dt>Events</dt>
          <dd>{device.eventCount}</dd>
          <dt>Push</dt>
          <dd>
            {device.hasPushToken ? (
              <span className="yes">enabled (token present)</span>
            ) : (
              <span className="muted">no token</span>
            )}
          </dd>
          <dt>Last seen</dt>
          <dd title={device.lastSeen || ''}>
            {relativeTime(device.lastSeenMillis)} ·{' '}
            <span className="muted">{fullDate(device.lastSeenMillis)}</span>
          </dd>
        </dl>

        {/* ---- Backup ---- */}
        <div className="detail-section">
          <h3>Cloud backup</h3>
          {!backup && !loadingBackup && (
            <button onClick={loadBackup} disabled={!device.recoveryCode}>
              {device.recoveryCode
                ? 'View backup'
                : 'No recovery code on device'}
            </button>
          )}
          {loadingBackup && (
            <div className="state">
              <span className="spinner" />
              Loading backup…
            </div>
          )}
          {backupError && <div className="result err">{backupError}</div>}

          {backup && !loadingBackup && (
            <>
              {!data ? (
                <div className="state">
                  {backup.note || 'No backup data available.'}
                </div>
              ) : (
                <>
                  <dl className="kv">
                    <dt>Updated</dt>
                    <dd>
                      {relativeTime(backup.updatedAtMillis)} ·{' '}
                      <span className="muted">
                        {fullDate(backup.updatedAtMillis)}
                      </span>
                    </dd>
                    <dt>Schema</dt>
                    <dd>{data.schemaVersion ?? '—'}</dd>
                    <dt>App</dt>
                    <dd>{data.app ?? '—'}</dd>
                    <dt>Events</dt>
                    <dd>
                      {evSummary.count}
                      {evSummary.first != null && (
                        <span className="muted">
                          {' '}
                          ({fullDate(evSummary.first)} →{' '}
                          {fullDate(evSummary.last)})
                        </span>
                      )}
                    </dd>
                    <dt>Cards</dt>
                    <dd>
                      {Array.isArray(data.cards)
                        ? `${data.cards.length} card(s)`
                        : '—'}
                    </dd>
                    {profile && (
                      <>
                        <dt>Profile</dt>
                        <dd className="muted">
                          {Object.keys(profile).length} field(s)
                        </dd>
                      </>
                    )}
                  </dl>
                  <button
                    className="mt8"
                    onClick={() =>
                      downloadJson(
                        `backup-${device.uid.slice(0, 8)}.json`,
                        backup.data
                      )
                    }
                  >
                    Download JSON
                  </button>{' '}
                  <button className="ghost mt8" onClick={loadBackup}>
                    Reload
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* ---- Send push to this device ---- */}
        <div className="detail-section">
          <h3>Send push to this device</h3>
          {device.hasPushToken ? (
            <PushForm uid={device.uid} onToast={onToast} />
          ) : (
            <div className="state">
              This device has no push token — nothing to send to.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
