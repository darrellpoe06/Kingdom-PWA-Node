// =============================================================================
// LedgerFreshness — "when did this screen last hear the family database?"
// =============================================================================
// DR-0708 (2026-09-30): Christina's phone and Darrell's desktop showed the same
// September with 75 rows between them, and neither screen said how old its
// picture was. This line says it, from the stamp table-sync writes only after
// the database answered in full (lib/sync-freshness.js). No stamp reads as
// "not confirmed", never as fresh (DR-0076). "Sync now" asks the live
// controller for a full re-read of the table.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { describeFreshness, getSyncStamp, onSyncFreshness, requestResync } from '../lib/sync-freshness.js';

const TONE = {
  fresh: 'border-[#5A6E3D] text-[#166534]',
  recent: 'border-[#5A6E3D] text-[#1A1815]',
  stale: 'border-[#B85838] text-[#B85838]',
  unknown: 'border-[#B85838] text-[#B85838]',
  failed: 'border-[#B85838] text-[#B85838]',
};

export default function LedgerFreshness({ table = 'transactions', label = 'Ledger' }) {
  const [snap, setSnap] = useState(() => getSyncStamp(table));
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    const off = onSyncFreshness((t) => { if (t === table) { setSnap(getSyncStamp(table)); setNow(Date.now()); } });
    // Re-word the age as it grows ("2 minutes ago" -> "20 minutes ago") without
    // re-reading anything: a render tick, not a sync.
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => { off(); clearInterval(tick); };
  }, [table]);

  const d = describeFreshness(snap, now);
  const syncNow = async () => {
    if (busy) return;
    setBusy(true); setNote('');
    try {
      const ran = await requestResync(table);
      if (!ran) setNote('Sign in on this device to sync the ledger with the family database.');
    } catch {
      setNote('The sync did not complete. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="ledger-freshness" data-state={d.state}
      className={`flex flex-wrap items-center gap-2 border bg-white px-2 py-1.5 text-[0.6875rem] ${TONE[d.state] || TONE.unknown}`}>
      <span className="font-semibold uppercase tracking-wider text-[0.5625rem]">{label}</span>
      <span className="flex-1 min-w-[12rem]" role="status" aria-live="polite">{d.text}</span>
      {snap.stamp && Number.isFinite(snap.stamp.rows) && (
        <span className="text-[#5A5751]">{snap.stamp.rows.toLocaleString()} rows as of that sync</span>
      )}
      <button type="button" onClick={syncNow} disabled={busy}
        className="text-[0.5625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60">
        {busy ? 'Syncing…' : 'Sync now'}
      </button>
      {note && <span className="w-full text-[#B85838]">{note}</span>}
    </div>
  );
}
