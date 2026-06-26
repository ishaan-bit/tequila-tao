// Shared filter model. One filter object drives BOTH the Dashboard (which stats
// to aggregate) and the Control Panel (which devices to list / broadcast to).

const DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_FILTERS = {
  q: '', // free-text: matches uid or recovery code
  platform: 'all', // 'all' | 'android' | 'ios' | 'web' | 'unknown'
  intent: 'all', // 'all' | 'cutback' | 'break' | 'quit' | ...
  version: 'all', // 'all' | '<appVersion>'
  push: 'all', // 'all' | 'enabled' | 'disabled'
  backup: 'all', // 'all' | 'present' | 'none'
  activity: 'all', // 'all' | 'active1' | 'active7' | 'active30' | 'dormant' | 'never'
};

// Build the dropdown option lists from the actual data so they only ever show
// values that exist. Returns sorted, de-duplicated arrays.
export function deriveOptions(devices) {
  const platforms = new Set();
  const intents = new Set();
  const versions = new Set();
  for (const d of devices) {
    platforms.add(d.platform || 'unknown');
    intents.add(d.intent || 'unset');
    versions.add(d.appVersion || 'unknown');
  }
  return {
    platforms: [...platforms].sort(),
    intents: [...intents].sort(),
    versions: [...versions].sort(sortVersionsDesc),
  };
}

// Newest version first when they look semver-ish; fall back to string order.
function sortVersionsDesc(a, b) {
  const pa = a.split('.').map((n) => parseInt(n, 10));
  const pb = b.split('.').map((n) => parseInt(n, 10));
  if (pa.every(Number.isFinite) && pb.every(Number.isFinite)) {
    for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
      const d = (pb[i] || 0) - (pa[i] || 0);
      if (d) return d;
    }
    return 0;
  }
  return a < b ? 1 : a > b ? -1 : 0;
}

export function isFiltered(filters) {
  return Object.keys(DEFAULT_FILTERS).some((k) => filters[k] !== DEFAULT_FILTERS[k]);
}

function matchesActivity(device, activity, now) {
  const ls = device.lastSeenMillis;
  if (activity === 'never') return ls == null;
  if (ls == null) return false;
  const age = now - ls;
  switch (activity) {
    case 'active1':
      return age <= DAY;
    case 'active7':
      return age <= 7 * DAY;
    case 'active30':
      return age <= 30 * DAY;
    case 'dormant':
      return age > 30 * DAY;
    default:
      return true;
  }
}

export function applyFilters(devices, filters, now = Date.now()) {
  const q = filters.q.trim().toLowerCase();
  return devices.filter((d) => {
    if (q) {
      const hay = `${d.uid || ''} ${d.recoveryCode || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.platform !== 'all' && (d.platform || 'unknown') !== filters.platform) return false;
    if (filters.intent !== 'all' && (d.intent || 'unset') !== filters.intent) return false;
    if (filters.version !== 'all' && (d.appVersion || 'unknown') !== filters.version) return false;
    if (filters.push === 'enabled' && !d.hasPushToken) return false;
    if (filters.push === 'disabled' && d.hasPushToken) return false;
    if (filters.backup === 'present' && !d.recoveryCode) return false;
    if (filters.backup === 'none' && d.recoveryCode) return false;
    if (filters.activity !== 'all' && !matchesActivity(d, filters.activity, now)) return false;
    return true;
  });
}
