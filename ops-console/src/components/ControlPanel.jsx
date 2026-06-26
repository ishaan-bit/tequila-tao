import { useState, useMemo } from 'react';
import DevicesTable from './DevicesTable.jsx';
import DeviceDetail from './DeviceDetail.jsx';
import PushForm from './PushForm.jsx';

// The operational view: broadcast to the current (filtered) audience, browse the
// filtered device registry, and drill into a single device.
export default function ControlPanel({ filtered, loading, error, onCopy, onToast }) {
  const [selected, setSelected] = useState(null);

  // Keep the selection valid as the filtered set changes underneath it.
  const selectedDevice = useMemo(
    () => (selected ? filtered.find((d) => d.id === selected) || null : null),
    [selected, filtered]
  );

  const pushable = useMemo(() => filtered.filter((d) => d.hasPushToken), [filtered]);
  const uids = pushable.map((d) => d.id);

  return (
    <div className="controlpanel">
      {/* ---- Broadcast to the filtered audience ---- */}
      <div className="card pad" style={{ marginBottom: 18 }}>
        <div className="card-head bare">
          <h2>Broadcast push</h2>
          <span className="muted small">
            {pushable.length} of {filtered.length} filtered device
            {filtered.length === 1 ? '' : 's'} can receive push
          </span>
        </div>
        {pushable.length === 0 ? (
          <div className="state">
            None of the filtered devices have a push token — nothing to send to.
          </div>
        ) : (
          <PushForm
            uids={uids}
            audienceLabel={`${pushable.length} filtered device${pushable.length === 1 ? '' : 's'}`}
            onToast={onToast}
          />
        )}
      </div>

      <div className={`layout ${selectedDevice ? 'with-detail' : ''}`}>
        <div className="card">
          <div className="card-head">
            <h2>
              Devices {!loading && <span className="muted">({filtered.length})</span>}
            </h2>
          </div>
          <DevicesTable
            devices={filtered}
            loading={loading}
            error={error}
            selectedUid={selectedDevice ? selectedDevice.id : null}
            onSelect={(d) => setSelected(d.id)}
            onCopy={onCopy}
          />
        </div>

        {selectedDevice && (
          <DeviceDetail
            key={selectedDevice.id}
            device={selectedDevice}
            onToast={onToast}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
}
