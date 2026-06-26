import { useState } from 'react';
import { sendPush } from '../api.js';

// Reusable push-notification form. Three target modes:
//   - single device : pass `uid` (string).
//   - filtered set   : pass `uids` (string[]) + `audienceLabel` (adds a confirm).
//   - all devices    : pass `broadcast` (adds a confirm).
export default function PushForm({ uid, uids, broadcast, audienceLabel, onToast }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const isMass = broadcast || (Array.isArray(uids) && uids.length > 0);
  const audience = audienceLabel || 'every device';
  const canSend = title.trim() && body.trim() && !busy;

  async function doSend() {
    setBusy(true);
    setError(null);
    setResult(null);
    setConfirming(false);
    try {
      const res = await sendPush({
        uid: isMass ? undefined : uid,
        uids: Array.isArray(uids) && uids.length ? uids : undefined,
        broadcast: broadcast ? true : undefined,
        title: title.trim(),
        body: body.trim(),
      });
      setResult(res);
      if (onToast) {
        onToast(
          `Sent: ${res.successCount} ok, ${res.failureCount} failed` +
            (res.requested === 0 ? ' (no tokens)' : '')
        );
      }
    } catch (e) {
      setError(e.message || 'Send failed');
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!canSend) return;
    if (isMass) setConfirming(true);
    else doSend();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field">
        <label>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notification title"
          maxLength={120}
        />
      </div>
      <div className="field">
        <label>Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Notification body"
          maxLength={400}
        />
      </div>

      {!confirming && (
        <div className="mt8">
          <button
            type="submit"
            className={isMass ? 'danger' : 'primary'}
            disabled={!canSend}
          >
            {busy
              ? 'Sending…'
              : isMass
              ? `Send to ${audience}`
              : 'Send push to this device'}
          </button>
        </div>
      )}

      {confirming && (
        <div className="confirm-box">
          This sends a push to <strong>{audience}</strong> with notifications
          enabled. Continue?
          <div className="actions">
            <button type="button" className="danger" disabled={busy} onClick={doSend}>
              {busy ? 'Sending…' : 'Yes, send'}
            </button>
            <button
              type="button"
              className="ghost"
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <div className="result err">{error}</div>}

      {result && (
        <div className={`result ${result.failureCount ? 'err' : 'ok'}`}>
          Requested {result.requested} · {result.successCount} sent ·{' '}
          {result.failureCount} failed
          {result.note ? ` — ${result.note}` : ''}
          {result.invalidTokens && result.invalidTokens.length > 0 && (
            <ul>
              {result.invalidTokens.map((t, i) => (
                <li key={i} className="mono">
                  {t.uid.slice(0, 8)}… — {t.code}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
