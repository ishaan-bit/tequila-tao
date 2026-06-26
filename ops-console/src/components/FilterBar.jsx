import { DEFAULT_FILTERS, deriveOptions, isFiltered } from '../lib/filters.js';

// One filter bar, shared by Dashboard and Control Panel. `devices` is the full
// (unfiltered) set — used both to derive dropdown options and to show the
// "showing N of M" count. `filtered` is the post-filter set.
export default function FilterBar({ devices, filtered, filters, onChange }) {
  const opts = deriveOptions(devices);
  const set = (patch) => onChange({ ...filters, ...patch });
  const active = isFiltered(filters);

  return (
    <div className="filterbar">
      <div className="filterbar-row">
        <div className="filter search">
          <input
            type="search"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search uid or recovery code…"
          />
        </div>

        <Select
          label="Platform"
          value={filters.platform}
          onChange={(v) => set({ platform: v })}
          options={opts.platforms}
        />
        <Select
          label="Goal"
          value={filters.intent}
          onChange={(v) => set({ intent: v })}
          options={opts.intents}
        />
        <Select
          label="Version"
          value={filters.version}
          onChange={(v) => set({ version: v })}
          options={opts.versions}
        />
        <Select
          label="Push"
          value={filters.push}
          onChange={(v) => set({ push: v })}
          options={[
            ['enabled', 'Has token'],
            ['disabled', 'No token'],
          ]}
        />
        <Select
          label="Backup"
          value={filters.backup}
          onChange={(v) => set({ backup: v })}
          options={[
            ['present', 'Backed up'],
            ['none', 'No backup'],
          ]}
        />
        <Select
          label="Activity"
          value={filters.activity}
          onChange={(v) => set({ activity: v })}
          options={[
            ['active1', 'Active today'],
            ['active7', 'Active 7d'],
            ['active30', 'Active 30d'],
            ['dormant', 'Dormant 30d+'],
            ['never', 'Never seen'],
          ]}
        />
      </div>

      <div className="filterbar-foot">
        <span className="count">
          Showing <strong>{filtered.length}</strong> of {devices.length} device
          {devices.length === 1 ? '' : 's'}
        </span>
        {active && (
          <button className="ghost" onClick={() => onChange({ ...DEFAULT_FILTERS })}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

// `options` is either an array of plain string values, or an array of
// [value, label] tuples. The "All" option is always prepended.
function Select({ label, value, onChange, options }) {
  const norm = options.map((o) => (Array.isArray(o) ? o : [o, o]));
  return (
    <label className="filter">
      <span className="filter-label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="all">All</option>
        {norm.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
