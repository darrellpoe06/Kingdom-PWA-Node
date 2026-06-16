// =============================================================================
// AppInterestAdmin — the invite list, for Darrell + Christina ONLY
// =============================================================================
// Reads app_interest (RLS allows only the two admin emails — DB is the real gate;
// we also check client-side for honest UI). Each row is someone who consented to
// be contacted. One-tap "Mark invited" records the invite; the mailto/sms links
// open a pre-filled invite the admin sends themselves (no silent auto-outbound —
// see feedback_autonomous_automation_three_brakes). Booted via ?invites=1.
//
// Accessibility: WCAG 2.1 AA tokens, labelled controls, aria-live on status.
import React, { useEffect, useState, useCallback } from 'react';
import supabase from '../lib/supabase.js';
import { fetchInterest, setInterestStatus, isAdminEmail } from '../lib/interest-sync.js';

const fmt = (iso) => {
  try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch (e) { return iso || ''; }
};

const inviteBody = (r) => `Hi ${r.name || 'there'},\n\nThanks for your interest in PoeTech! Here's how to get the app on your device:\n\nhttps://poetech.us/poetech-app/?join=1\n\nIf you hit any trouble, just reply and we'll help you get set up.\n\n— Darrell & Christina, PoeTech`;

export default function AppInterestAdmin() {
  const [phase, setPhase] = useState('checking'); // checking | denied | loading | ready | error
  const [rows, setRows] = useState([]);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const email = data?.session?.user?.email || null;
    if (!isAdminEmail(email)) { setPhase('denied'); return; }
    setPhase('loading');
    const res = await fetchInterest();
    if (!res.ok) { setPhase('error'); return; }
    setRows(res.rows);
    setPhase('ready');
  }, []);

  useEffect(() => { load(); }, [load]);

  const mark = async (id, status) => {
    const res = await setInterestStatus(id, status);
    if (res.ok) {
      setRows((rs) => rs.map((r) => (r.id === id
        ? { ...r, status, invited_at: status === 'invited' ? new Date().toISOString() : r.invited_at }
        : r)));
      setNote(`Marked ${status}.`);
    } else {
      setNote('Could not update — try again.');
    }
  };

  if (phase === 'checking' || phase === 'loading') {
    return <Shell><p className="text-sm text-[#5A5751]">Loading the invite list…</p></Shell>;
  }
  if (phase === 'denied') {
    return <Shell><p className="text-sm text-[#7A1F1F]">This list is private to the PoeTech admins. Sign in as Darrell or Christina to view it.</p></Shell>;
  }
  if (phase === 'error') {
    return <Shell><p className="text-sm text-[#7A1F1F]">Couldn’t load the list (is migration 0023 applied?). Try again shortly.</p></Shell>;
  }

  const counts = rows.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});

  return (
    <Shell>
      <div className="flex items-baseline justify-between gap-2 mb-3 flex-wrap">
        <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          {rows.length} interested · {counts.new || 0} new · {counts.invited || 0} invited
        </p>
        <button type="button" onClick={load} className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A5751] text-[#1A1815] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">Refresh</button>
      </div>
      {note && <p className="text-[11px] text-[#5A6E3D] mb-2" aria-live="polite">{note}</p>}

      {rows.length === 0 ? (
        <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>No one’s asked for an invite yet. Share <span className="font-mono text-xs">poetech.us/poetech-app/?join=1</span> and they’ll show up here.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="border border-[#E8E4DC] p-3">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                  {r.name || '(no name)'} {r.is_minor && <span className="text-[10px] uppercase tracking-wider text-[#B85838]">· minor{r.parent_confirmed ? ' · parent ok' : ' · awaiting parent'}</span>}
                </span>
                <span className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(r.created_at)} · {r.platform || '—'}</span>
              </div>
              <div className="text-xs text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
                {r.email && <a href={`mailto:${r.email}?subject=${encodeURIComponent('Your PoeTech invite')}&body=${encodeURIComponent(inviteBody(r))}`} className="underline text-[#5A6E3D] break-all">{r.email}</a>}
                {r.phone && <span> · {r.phone}</span>}
              </div>
              {r.issue && <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>“{r.issue}”</p>}
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 border ${r.status === 'invited' ? 'border-[#5A6E3D] text-[#5A6E3D]' : 'border-[#5A5751] text-[#5A5751]'}`}>{r.status}</span>
                {r.status !== 'invited' && (
                  <button type="button" onClick={() => mark(r.id, 'invited')} className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">Mark invited</button>
                )}
                {r.status !== 'closed' && (
                  <button type="button" onClick={() => mark(r.id, 'closed')} className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A5751] text-[#5A5751] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">Close</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <section className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">PoeTech · Admin</div>
      <h2 className="text-2xl mt-1 mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Who wants the app</h2>
      <p className="text-xs text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>People who asked for an invite or help installing. Private to Darrell &amp; Christina.</p>
      {children}
    </section>
  );
}
