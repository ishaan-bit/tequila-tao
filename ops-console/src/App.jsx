import { useState, useEffect, useCallback } from 'react';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  signOut,
  isAllowlisted,
} from './firebase.js';
import { fetchDevices } from './api.js';
import { copyToClipboard } from './utils.js';
import DevicesTable from './components/DevicesTable.jsx';
import DeviceDetail from './components/DeviceDetail.jsx';
import PushForm from './components/PushForm.jsx';

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
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

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
      // Keep the selected device in sync with refreshed data.
      setSelected((cur) =>
        cur ? (res.devices || []).find((d) => d.id === cur.id) || null : null
      );
    } catch (e) {
      setError(e.message || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
        <div className="who">
          <span>{user.email}</span>
          <button className="ghost" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <div className="container">
        {/* Broadcast */}
        <div className="card pad" style={{ marginBottom: 18 }}>
          <div className="card-head" style={{ padding: 0, border: 'none', marginBottom: 12 }}>
            <h2>Broadcast push</h2>
          </div>
          <PushForm broadcast onToast={showToast} />
        </div>

        <div className={`layout ${selected ? 'with-detail' : ''}`}>
          <div className="card">
            <div className="card-head">
              <h2>
                Devices{' '}
                {!loading && (
                  <span className="muted">({devices.length})</span>
                )}
              </h2>
              <button onClick={load} disabled={loading}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            <DevicesTable
              devices={devices}
              loading={loading}
              error={error}
              selectedUid={selected ? selected.id : null}
              onSelect={setSelected}
              onCopy={copy}
            />
          </div>

          {selected && (
            <DeviceDetail
              key={selected.id}
              device={selected}
              onToast={showToast}
              onClose={() => setSelected(null)}
            />
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
