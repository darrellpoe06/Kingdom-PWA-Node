// RentCast property-valuation connector (r27) — pre-fills market value + value
// range for a Real Estate property from the RentCast AVM. Per
// MODULAR-EXTENSIBILITY.md: single-file module, props-only dependency injection,
// graceful degradation when the backend isn't configured.
//
// Architecture:
//   PWA -> Cloudflare Worker (/property/lookup) -> RentCast API
//   API key stays server-side. 24h cache extends the free tier (50 calls/mo).
//
// Per CONNECTED-CONTEXT.md: writes provenance to the property's market record so
// the user always knows where the number came from and when.
import React, { useState } from 'react';

const fmt$ = (n) => n == null || !isFinite(n) ? '—' : `$${Math.round(n).toLocaleString()}`;

export function RentCastPrefill({ rental, apiUrl = '', apiToken = '', onConfirm }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showSetup, setShowSetup] = useState(false);

  const canTry = apiUrl && apiToken && rental && rental.address && rental.city && rental.state;
  const reset = () => { setResult(null); setError(''); setBusy(false); };

  const lookup = async () => {
    if (!canTry) { setShowSetup(true); return; }
    setBusy(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${apiUrl.replace(/\/+$/, '')}/property/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          address: rental.address,
          city: rental.city,
          state: rental.state,
          zip: rental.zip || '',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === 'rentcast-not-configured') {
          setError('RentCast API key not set on the server. Tell the admin to run: wrangler secret put RENTCAST_API_KEY');
        } else if (res.status === 404) {
          setError(`RentCast has no data for ${rental.address}. Try a different address or fall back to Zillow/Realtor links.`);
        } else if (res.status === 401) {
          setError('RentCast API key invalid or out of free-tier calls. Upgrade or wait until next month.');
        } else {
          setError(data.message || data.error || 'Lookup failed.');
        }
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(`Network error: ${e.message || 'unable to reach the worker'}`);
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    if (!result || result.valueEstimate == null) return;
    onConfirm && onConfirm({
      marketValue: result.valueEstimate,
      marketValueLow: result.valueRangeLow,
      marketValueHigh: result.valueRangeHigh,
      valueSource: 'rentcast',
      valueAsOf: result.fetched_at ? result.fetched_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      valueConfidence: result.confidence,
      valueComparablesCount: result.comparablesCount,
    });
    reset();
  };

  if (!canTry && !showSetup && !result && !error) {
    // Subtle, unobtrusive entry — show even when not configured so the user
    // knows the option exists. Tapping it explains setup.
    return (
      <button
        type="button"
        onClick={() => setShowSetup(true)}
        title="Auto-fill market value from RentCast (requires backend setup)"
        className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] underline px-2 py-1 focus:outline focus:outline-2 focus:outline-[#B85838]"
      >
        ✨ Auto-fill from RentCast
      </button>
    );
  }

  if (showSetup) {
    return (
      <div className="bg-[#FAF8F4] border border-[#1A1815] p-3 space-y-2 my-2">
        <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#1A1815] font-semibold">RentCast auto-fill · setup required</div>
        <p className="text-xs leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          To auto-fill market value (instead of typing it), the system needs two things:
        </p>
        <ol className="text-xs space-y-1 list-decimal pl-4" style={{ fontFamily: '"Fraunces", serif' }}>
          <li>The Cloudflare Worker URL configured in <strong>Inbound · Setup</strong> (same one Voice Ops uses).</li>
          <li>A RentCast API key set as a Worker secret (free tier: 50 calls/month). <a href="https://app.rentcast.io" target="_blank" rel="noopener noreferrer" className="underline text-[#B85838]">Sign up at rentcast.io</a>, copy the key, then run <code className="px-1 bg-white">wrangler secret put RENTCAST_API_KEY</code>.</li>
        </ol>
        <p className="text-[0.6875rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          Once setup is done, this button fetches market value + value range + confidence + comp count in one tap. You always confirm before saving — the system never overwrites your data silently.
        </p>
        <button type="button" onClick={() => setShowSetup(false)} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Close</button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="bg-white border-2 border-[#5A6E3D] p-3 space-y-2 my-2">
        <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold">
          ✨ RentCast estimate {result._cached ? '· (cached, 24h)' : ''}
        </div>
        <div className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{fmt$(result.valueEstimate)}</div>
        <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          Range: {fmt$(result.valueRangeLow)} – {fmt$(result.valueRangeHigh)}
          {result.confidence != null && <> · Confidence: {(result.confidence * 100).toFixed(0)}%</>}
          {result.comparablesCount > 0 && <> · Based on {result.comparablesCount} comp{result.comparablesCount === 1 ? '' : 's'}</>}
        </div>
        <p className="text-[0.6875rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          Save this as the property's market value? Provenance will be logged: source=rentcast, as-of={result.fetched_at?.slice(0, 10)}. You can change it any time.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={confirm} className="bg-[#1A1815] text-white px-3 py-1.5 text-xs uppercase tracking-wider font-semibold hover:bg-[#5A6E3D] focus:outline focus:outline-2 focus:outline-[#B85838]">✓ Save as market value</button>
          <button type="button" onClick={reset} className="border border-[#1A1815] px-3 py-1.5 text-xs uppercase tracking-wider hover:bg-[#FAF8F4]">× Skip</button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-2 border-[#B85838] p-3 space-y-2 my-2">
        <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold">RentCast lookup failed</div>
        <p className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{error}</p>
        <button type="button" onClick={reset} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Dismiss</button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={lookup}
      disabled={busy || !canTry}
      title={canTry ? 'Fetch a market value estimate from RentCast' : 'Address and city + state are required first'}
      className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline focus:outline-2 focus:outline-[#B85838]"
    >
      {busy ? 'Looking up…' : '✨ Auto-fill from RentCast'}
    </button>
  );
}

export default RentCastPrefill;
