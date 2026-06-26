import { shortUid, relativeTime } from '../utils.js';

export default function DevicesTable({
  devices,
  loading,
  error,
  selectedUid,
  onSelect,
  onCopy,
}) {
  if (loading) {
    return (
      <div className="state">
        <span className="spinner" />
        Loading devices…
      </div>
    );
  }
  if (error) {
    return <div className="state error">{error}</div>;
  }
  if (!devices || devices.length === 0) {
    return <div className="state">No devices found.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="devices">
        <thead>
          <tr>
            <th>UID</th>
            <th>Platform</th>
            <th>Version</th>
            <th>Goal</th>
            <th>Last seen</th>
            <th>Events</th>
            <th>Push</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr
              key={d.id}
              className={d.id === selectedUid ? 'selected' : ''}
              onClick={() => onSelect(d)}
            >
              <td>
                <span
                  className="mono copyable"
                  title={`${d.uid} — click to copy`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(d.uid);
                  }}
                >
                  {shortUid(d.uid)}
                </span>
              </td>
              <td>
                {d.platform ? (
                  <span className={`pill platform-${d.platform}`}>
                    {d.platform}
                  </span>
                ) : (
                  <span className="no">—</span>
                )}
              </td>
              <td className="mono">{d.appVersion || '—'}</td>
              <td>
                {d.intent ? <span className="pill">{d.intent}</span> : '—'}
              </td>
              <td title={d.lastSeen || ''}>{relativeTime(d.lastSeenMillis)}</td>
              <td>{d.eventCount}</td>
              <td>
                {d.hasPushToken ? (
                  <span className="yes" title="Has push token">
                    ✓
                  </span>
                ) : (
                  <span className="no" title="No push token">
                    —
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
