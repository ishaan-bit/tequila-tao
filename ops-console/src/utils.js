// Small formatting helpers used across the UI.

export function shortUid(uid) {
  if (!uid) return '—';
  if (uid.length <= 12) return uid;
  return `${uid.slice(0, 6)}…${uid.slice(-4)}`;
}

export function relativeTime(input) {
  if (input == null) return '—';
  const then =
    typeof input === 'number' ? input : new Date(input).getTime();
  if (Number.isNaN(then)) return '—';

  const diff = Date.now() - then;
  const abs = Math.abs(diff);
  const sec = Math.round(abs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);

  let out;
  if (sec < 45) out = 'just now';
  else if (min < 60) out = `${min}m`;
  else if (hr < 24) out = `${hr}h`;
  else if (day < 30) out = `${day}d`;
  else out = new Date(then).toLocaleDateString();

  if (out === 'just now') return out;
  return diff >= 0 ? `${out} ago` : `in ${out}`;
}

export function fullDate(input) {
  if (input == null) return '—';
  const ms = typeof input === 'number' ? input : new Date(input).getTime();
  if (Number.isNaN(ms)) return '—';
  return new Date(ms).toLocaleString();
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Trigger a browser download of a JS object as a pretty-printed JSON file.
export function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Summarize a backup's events array → { count, first, last }.
export function summarizeEvents(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return { count: 0, first: null, last: null };
  }
  let first = Infinity;
  let last = -Infinity;
  for (const e of events) {
    const ts = e && typeof e.ts === 'number' ? e.ts : null;
    if (ts == null) continue;
    if (ts < first) first = ts;
    if (ts > last) last = ts;
  }
  return {
    count: events.length,
    first: Number.isFinite(first) ? first : null,
    last: Number.isFinite(last) ? last : null,
  };
}
