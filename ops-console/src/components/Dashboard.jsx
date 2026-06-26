import { useMemo } from 'react';
import { computeStats, pct, compactNumber } from '../lib/stats.js';

// The read-only analytics view. Every number is derived client-side from the
// already-fetched (and filtered) device list — see lib/stats.js.
export default function Dashboard({ filtered }) {
  const s = useMemo(() => computeStats(filtered), [filtered]);

  if (filtered.length === 0) {
    return (
      <div className="card">
        <div className="state">No devices match the current filters.</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* ---- KPI cards ---- */}
      <div className="kpis">
        <StatCard label="Devices" value={compactNumber(s.total)} />
        <StatCard
          label="Active today"
          value={compactNumber(s.active1)}
          sub={`${pct(s.active1, s.total)}%`}
          tone="good"
        />
        <StatCard
          label="Active 7 days"
          value={compactNumber(s.active7)}
          sub={`${pct(s.active7, s.total)}%`}
          tone="good"
        />
        <StatCard
          label="Active 30 days"
          value={compactNumber(s.active30)}
          sub={`${pct(s.active30, s.total)}%`}
        />
        <StatCard
          label="Push-enabled"
          value={compactNumber(s.pushEnabled)}
          sub={`${pct(s.pushEnabled, s.total)}%`}
          tone="accent"
        />
        <StatCard
          label="Backed up"
          value={compactNumber(s.backedUp)}
          sub={`${pct(s.backedUp, s.total)}%`}
        />
        <StatCard label="Total events" value={compactNumber(s.totalEvents)} />
        <StatCard
          label="Events / device"
          value={s.avgEvents}
          sub={`median ${s.medianEvents}`}
        />
      </div>

      {/* ---- Daily-active time series ---- */}
      <div className="card pad">
        <div className="card-head bare">
          <h2>Devices last seen — past 14 days</h2>
        </div>
        <MiniBars series={s.series} />
      </div>

      {/* ---- Breakdowns ---- */}
      <div className="breakdowns">
        <Breakdown title="Platform" rows={s.platform} total={s.total} />
        <Breakdown title="Goal" rows={s.intent} total={s.total} />
        <Breakdown title="App version" rows={s.version} total={s.total} />
        <Breakdown title="Last activity" rows={s.recency} total={s.total} ordered />
        <Breakdown title="Engagement (events)" rows={s.engagement} total={s.total} ordered />
        <Breakdown title="Currency" rows={s.currency} total={s.total} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function StatCard({ label, value, sub, tone }) {
  return (
    <div className={`stat ${tone ? `tone-${tone}` : ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub != null && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizontal labeled bars. `ordered` keeps the given order (for buckets);
// otherwise rows arrive pre-sorted by count.
function Breakdown({ title, rows, total, ordered }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="card pad breakdown">
      <div className="card-head bare">
        <h2>{title}</h2>
      </div>
      {rows.length === 0 ? (
        <div className="muted small">No data</div>
      ) : (
        <ul className="bars">
          {rows.map((r) => (
            <li key={r.key}>
              <div className="bar-top">
                <span className="bar-key" title={r.key}>
                  {r.key}
                </span>
                <span className="bar-val">
                  {r.count}
                  <span className="muted"> · {pct(r.count, total)}%</span>
                </span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${ordered ? pct(r.count, total) : (r.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tiny CSS-only vertical bar chart for the 14-day series.
function MiniBars({ series }) {
  const max = Math.max(1, ...series.map((d) => d.count));
  return (
    <div className="minibars">
      {series.map((d) => (
        <div className="minibar" key={d.day} title={`${d.day}: ${d.count}`}>
          <div className="minibar-track">
            <div
              className="minibar-fill"
              style={{ height: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="minibar-count">{d.count || ''}</span>
          <span className="minibar-day">{d.day}</span>
        </div>
      ))}
    </div>
  );
}
