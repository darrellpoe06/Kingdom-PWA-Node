// =============================================================================
// TrustedDevices — manage / revoke the user's device-trust list (P2 UI)
// =============================================================================
// A trusted device counts as one access point (so the user only needs their PIN
// for the fast path). This panel lists the devices that hold a valid trust
// token and lets the user revoke any of them — revoking immediately stops the
// fast path on that device (it must do a full multi-point login again).
//
// WCAG 2.1 AA: semantic list, real buttons, role="status" for the empty/loading
// state, role="alert" for errors, visible focus outlines, AA-contrast palette.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { listTrustedDevices, revokeDevice, getDeviceId } from '../lib/device-trust.js';

function fmt(ts) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch (_) { return String(ts).slice(0, 10); }
}

export default function TrustedDevices({ userId }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const thisDeviceId = getDeviceId();

  async function load() {
    setLoading(true); setError('');
    const { devices: list, backendAvailable } = await listTrustedDevices();
    setUnavailable(!backendAvailable);
    setDevices(list);
    setLoading(false);
  }

  useEffect(() => { load(); }, [userId]);

  async function handleRevoke(d) {
    setBusyId(d.id); setError('');
    const isThis = d.device_id === thisDeviceId;
    const { ok } = await revokeDevice(d.id, userId, isThis);
    setBusyId(null);
    if (ok) load();
    else setError('Could not revoke that device. Try again.');
  }

  if (loading) return <p role="status" className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Loading your devices…</p>;
  if (unavailable) {
    return <p role="status" className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
      Device trust isn’t active yet on this server. Once it’s enabled, the devices you sign in on will appear here.
    </p>;
  }

  const active = devices.filter((d) => !d.revoked);

  return (
    <div>
      <h3 className="text-lg mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Trusted devices</h3>
      <p className="text-sm text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        These devices remember you, so you only need your PIN to get in. Revoke any you don’t recognize — that device will have to fully sign in again.
      </p>
      {error && <p role="alert" className="text-sm text-[#9A3412] bg-[#FDE7DC] border border-[#9A3412] px-3 py-2 mb-3" style={{ fontFamily: '"Fraunces", serif' }}>{error}</p>}
      {active.length === 0 ? (
        <p role="status" className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No trusted devices yet.</p>
      ) : (
        <ul className="space-y-2">
          {active.map((d) => {
            const isThis = d.device_id === thisDeviceId;
            return (
              <li key={d.id} className="flex items-center justify-between gap-3 border border-[#1A1815] px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1A1815] truncate" style={{ fontFamily: '"Fraunces", serif' }}>
                    {d.label || 'Device'}{isThis && <span className="ml-2 text-[10px] uppercase tracking-wider text-[#3F5A2A]">This device</span>}
                  </div>
                  <div className="text-[11px] text-[#5A5751]">Added {fmt(d.created_at)} · Last used {fmt(d.last_seen_at)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(d)}
                  disabled={busyId === d.id}
                  aria-label={`Revoke trust for ${d.label || 'this device'}`}
                  className="shrink-0 text-[10px] uppercase tracking-wider px-2 py-1.5 border border-[#9A3412] text-[#9A3412] hover:bg-[#9A3412] hover:text-white font-semibold focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-50">
                  {busyId === d.id ? 'Revoking…' : 'Revoke'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
