import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  signOut,
  isAllowlisted,
} from './firebase.js';
import { fetchDevices } from './api.js';
import { copyToClipboard } from './utils.js';
import { DEFAULT_FILTERS, applyFilters } from './lib/filters.js';
import FilterBar from './components/FilterBar.jsx';
import Dashboard from './components/Dashboard.jsx';
import ControlPanel from './components/ControlPanel.jsx';

export default function App() {
  // ---- auth state ----
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [signInError, setSignInError] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  const allowed = user && isAllowlisted(user.email);

  if (!authReady) {
    return (
      <div className="signin">
        <div className="box">
          <span className="spinner" />
          Loading…
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <SignIn user={user} signInError={signInError} setSignInError={setSignInError} />
    );
  }

  return <Console user={user} />;
}

// ---------------------------------------------------------------------------
function SignIn({ user, signInError, setSignInError }) {
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    setSignInError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setSignInError(e.message || 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="signin">
      <div className="box">
        <h1>Tequila Tao · Ops Console</h1>
        <p>Private admin access. Sign in with an authorized Google account.</p>
        <button className="primary" onClick={go} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in with Google'}
        </button>
        {signInError && <div className="denied">{signInError}</div>}
        {user && !isAllowlisted(user.email) && (
          <div className="denied">
            {user.email} is not on the admin allowlist.
            <div className="mt8">
              <button className="ghost" onClick={() => signOut()}>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Console({ user }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState('dashboard'); // 'dashboard' | 'control'
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });

  const showToast = useCallback((msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDevices();
      setDevices(res.devices || []);
    } catch (e) {
      setError(e.message || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => applyFilters(devices, filters), [devices, filters]);

  async function copy(text) {
    const ok = await copyToClipboard(text);
    showToast(ok ? 'Copied' : 'Copy failed');
  }

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <h1>Tequila Tao</h1>
          <span className="tag">Ops Console</span>
        </div>
        <nav className="tabs">
          <button
            className={tab === 'dashboard' ? 'tab active' : 'tab'}
            onClick={() => setTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={tab === 'control' ? 'tab active' : 'tab'}
            onClick={() => setTab('control')}
          >
            Control panel
          </button>
        </nav>
        <div className="who">
          <button onClick={load} disabled={loading} title="Reload devices">
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <span className="email">{user.email}</span>
          <button className="ghost" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <div className="container">
        {error && <div className="result err" style={{ marginBottom: 16 }}>{error}</div>}

        <FilterBar
          devices={devices}
          filtered={filtered}
          filters={filters}
          onChange={setFilters}
        />

        {tab === 'dashboard' ? (
          <Dashboard filtered={filtered} />
        ) : (
          <ControlPanel
            filtered={filtered}
            loading={loading}
            error={error}
            onCopy={copy}
            onToast={showToast}
          />
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
