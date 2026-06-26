// Pure aggregate-stat computation over a list of device docs (as returned by
// /api/devices). Everything the Dashboard shows is derived here from a single
// fetch — no extra API calls — so filters stay instant and client-side.

const DAY = 24 * 60 * 60 * 1000;

export function pct(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10; // one decimal
}

// Compact a number for KPI display (1234 → 1.2k).
export function compactNumber(n) {
  if (n == null || Number.isNaN(n)) return '—';
  if (Math.abs(n) < 1000) return String(n);
  if (Math.abs(n) < 1_000_000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

// Count occurrences of `key(device)` into a sorted [{ key, count }] list.
function tally(devices, keyFn, { sortByCount = true } = {}) {
  const map = new Map();
  for (const d of devices) {
    const k = keyFn(d);
    map.set(k, (map.get(k) || 0) + 1);
  }
  const out = [...map.entries()].map(([key, count]) => ({ key, count }));
  if (sortByCount) out.sort((a, b) => b.count - a.count);
  return out;
}

function median(nums) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

// Day key "MM-DD" in local time from epoch millis.
function dayLabel(millis) {
  const d = new Date(millis);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function computeStats(devices, now = Date.now()) {
  const total = devices.length;

  let active1 = 0;
  let active7 = 0;
  let active30 = 0;
  let dormant = 0;
  let neverSeen = 0;
  let pushEnabled = 0;
  let backedUp = 0;
  let totalEvents = 0;
  const eventCounts = [];

  for (const d of devices) {
    if (d.hasPushToken) pushEnabled += 1;
    if (d.recoveryCode) backedUp += 1;
    const ev = typeof d.eventCount === 'number' ? d.eventCount : 0;
    totalEvents += ev;
    eventCounts.push(ev);

    const ls = d.lastSeenMillis;
    if (ls == null) {
      neverSeen += 1;
      continue;
    }
    const age = now - ls;
    if (age <= DAY) active1 += 1;
    if (age <= 7 * DAY) active7 += 1;
    if (age <= 30 * DAY) active30 += 1;
    else dormant += 1;
  }

  // Recency buckets (mutually exclusive) for the activity breakdown.
  const recency = [
    { key: 'Today', count: 0 },
    { key: '1–7 days', count: 0 },
    { key: '8–30 days', count: 0 },
    { key: '30+ days', count: 0 },
    { key: 'Never', count: 0 },
  ];
  for (const d of devices) {
    const ls = d.lastSeenMillis;
    if (ls == null) recency[4].count += 1;
    else {
      const age = now - ls;
      if (age <= DAY) recency[0].count += 1;
      else if (age <= 7 * DAY) recency[1].count += 1;
      else if (age <= 30 * DAY) recency[2].count += 1;
      else recency[3].count += 1;
    }
  }

  // Engagement buckets by event count.
  const engagement = [
    { key: '0', count: 0 },
    { key: '1–10', count: 0 },
    { key: '11–50', count: 0 },
    { key: '51–200', count: 0 },
    { key: '200+', count: 0 },
  ];
  for (const ev of eventCounts) {
    if (ev === 0) engagement[0].count += 1;
    else if (ev <= 10) engagement[1].count += 1;
    else if (ev <= 50) engagement[2].count += 1;
    else if (ev <= 200) engagement[3].count += 1;
    else engagement[4].count += 1;
  }

  // Daily-active time series for the last 14 days, bucketed by lastSeen day.
  const DAYS = 14;
  const series = [];
  const startMid = startOfDay(now) - (DAYS - 1) * DAY;
  const idxByKey = new Map();
  for (let i = 0; i < DAYS; i += 1) {
    const ms = startMid + i * DAY;
    series.push({ day: dayLabel(ms), count: 0 });
    idxByKey.set(startOfDay(ms), i);
  }
  for (const d of devices) {
    if (d.lastSeenMillis == null) continue;
    const k = startOfDay(d.lastSeenMillis);
    const i = idxByKey.get(k);
    if (i != null) series[i].count += 1;
  }

  return {
    total,
    active1,
    active7,
    active30,
    dormant,
    neverSeen,
    pushEnabled,
    backedUp,
    totalEvents,
    avgEvents: total ? Math.round((totalEvents / total) * 10) / 10 : 0,
    medianEvents: median(eventCounts),
    platform: tally(devices, (d) => d.platform || 'unknown'),
    intent: tally(devices, (d) => d.intent || 'unset'),
    version: tally(devices, (d) => d.appVersion || 'unknown'),
    currency: tally(devices, (d) => d.currency || 'unknown'),
    recency,
    engagement,
    series,
  };
}

function startOfDay(millis) {
  const d = new Date(millis);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
