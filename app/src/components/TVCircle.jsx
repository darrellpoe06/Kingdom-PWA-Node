// =============================================================================
// TVCircle — the family/circle SHARING surface for TV Time (0074)
// =============================================================================
// Darrell 2026-07-04, co-designed. Form a circle (household/friends), invite by
// code, and see the shows others shared with you — Us / Family / Circle — plus a
// "what everyone's watching" feed. You only ever see what the DB (0074 RLS) lets
// you: kids never see 'us', a stranger's family sees nothing.
//
// ⚠ GATED. The whole surface is behind TV_SHARING_ENABLED (tv-circle-sync.js),
// which is FALSE until the live NAS data-isolation smoke test passes. While off,
// this renders nothing — TV Time is unchanged, no cross-person read happens. The
// enabled path is proven by a mocked render test now and by the isolation test on
// deploy. WCAG-AA themed classes + UiIcon (no inline color / emoji-as-icon).
// =============================================================================
import React, { useEffect, useState, useCallback } from 'react';
import UiIcon from './UiIcon.jsx';
import { AUDIENCES } from '../lib/tv-sharing.js';
import {
  TV_SHARING_ENABLED, myCircles, createCircle, joinByInvite, circleMembers,
  publishShares, fetchCircleShares, bucketShares, feedForBucket,
} from '../lib/tv-circle-sync.js';

const serif = { fontFamily: '"Fraunces", serif' };
const BTN = 'text-[0.6875rem] uppercase tracking-wider px-2 py-1 focus:outline focus:outline-2 focus:outline-[#B85838]';

// A read-only card for a show someone shared with you (you view, not edit).
function SharedShowCard({ title, watched }) {
  const n = watched && typeof watched === 'object' ? Object.keys(watched).length : 0;
  return (
    <div className="bg-white border border-[#E8E4DC] p-2">
      <div className="text-[0.75rem] font-semibold text-[#1A1815] leading-tight" style={serif}>{title}</div>
      {n > 0 && <div className="text-[0.5625rem] text-[#5A6E3D]">{n} episode{n === 1 ? '' : 's'} in</div>}
    </div>
  );
}

export default function TVCircle({ state, catalog = {}, email = null }) {
  const [circles, setCircles] = useState([]);
  const [active, setActive] = useState(null);       // { id, name, kind, invite_code, role }
  const [members, setMembers] = useState([]);
  const [shares, setShares] = useState([]);
  const [tab, setTab] = useState('family');
  const [joinCode, setJoinCode] = useState('');
  const [newName, setNewName] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const loadCircles = useCallback(async () => {
    const list = await myCircles();
    setCircles(list);
    setActive((cur) => cur || list[0] || null);
  }, []);

  useEffect(() => { if (TV_SHARING_ENABLED) loadCircles(); }, [loadCircles]);

  const loadActive = useCallback(async (circleId) => {
    if (!circleId) { setMembers([]); setShares([]); return; }
    const [mem, sh] = await Promise.all([circleMembers(circleId), fetchCircleShares(circleId)]);
    setMembers(mem);
    setShares(sh);
  }, []);

  useEffect(() => { if (TV_SHARING_ENABLED && active) loadActive(active.id); }, [active, loadActive]);

  if (!TV_SHARING_ENABLED) return null;

  const names = {};
  for (const m of members) names[m.member] = m.display || (m.member === email ? 'You' : 'Member');
  const buckets = bucketShares(shares, names);

  const doCreate = async (kind) => {
    setBusy(true); setMsg('');
    const res = await createCircle(newName || (kind === 'household' ? 'Our Home' : 'The Crew'), kind);
    setBusy(false);
    if (!res) { setMsg('Could not create the circle right now.'); return; }
    setNewName('');
    await loadCircles();
    setMsg(`Circle created. Share the code ${res.invite_code} with your people.`);
  };

  const doJoin = async () => {
    if (!joinCode.trim()) return;
    setBusy(true); setMsg('');
    const res = await joinByInvite(joinCode);
    setBusy(false);
    if (!res) { setMsg('That code didn’t match a circle.'); return; }
    setJoinCode('');
    await loadCircles();
    setMsg('You’re in.');
  };

  const doPublish = async () => {
    if (!active) return;
    setBusy(true); setMsg('');
    const ok = await publishShares(state, active.id, catalog);
    setBusy(false);
    setMsg(ok ? 'Shared your tagged shows to this circle.' : 'Couldn’t publish right now.');
    if (ok) loadActive(active.id);
  };

  const feed = feedForBucket(buckets[tab]);

  return (
    <section className="mb-4 bg-white border-2 border-[#1A1815] p-4 sm:p-5" aria-labelledby="tv-circle">
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold inline-flex items-center gap-1.5">
        <UiIcon name="users" /> <span id="tv-circle">Your circle</span>
      </div>

      {/* Setup: create or join when you have no circle. */}
      {circles.length === 0 ? (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-[#5A5751] leading-relaxed" style={serif}>
            Start a circle to share shows. A <strong>home</strong> has parents + kids (kids never see “Us” shows); a
            <strong> friends</strong> circle is just your people. Nothing shares until you tag a show and publish.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Circle name (optional)"
              className="text-sm px-2 py-1 border border-[#E8E4DC] text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" aria-label="Circle name" />
            <button type="button" disabled={busy} onClick={() => doCreate('household')} className={`${BTN} bg-[#1A1815] text-white hover:bg-[#B85838] disabled:opacity-50`}>Start a home</button>
            <button type="button" disabled={busy} onClick={() => doCreate('friends')} className={`${BTN} border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50`}>Start a friends circle</button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Have a code? Enter it"
              className="text-sm px-2 py-1 border border-[#E8E4DC] text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" aria-label="Invite code" />
            <button type="button" disabled={busy || !joinCode.trim()} onClick={doJoin} className={`${BTN} border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-50`}>Join</button>
          </div>
        </div>
      ) : (
        <div className="mt-2">
          {/* Circle picker + invite code + publish. */}
          <div className="flex flex-wrap items-center gap-2">
            {circles.length > 1 && (
              <select value={active?.id || ''} onChange={(e) => setActive(circles.find((c) => c.id === e.target.value) || null)}
                className="text-xs border border-[#E8E4DC] bg-white text-[#1A1815] px-2 py-1" aria-label="Choose circle">
                {circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            {active && (
              <>
                <span className="text-sm font-semibold text-[#1A1815]" style={serif}>{active.name}</span>
                <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">code <strong className="text-[#1A1815]">{active.invite_code}</strong></span>
                <button type="button" disabled={busy} onClick={doPublish} className={`${BTN} bg-[#5A6E3D] text-white hover:bg-[#1A1815] disabled:opacity-50`}>Share my tagged shows</button>
              </>
            )}
          </div>

          {/* View tabs: Us / Family / Circle. */}
          <div className="flex flex-wrap gap-1 mt-3" role="tablist" aria-label="Shared views">
            {AUDIENCES.map((a) => (
              <button key={a.key} type="button" role="tab" aria-selected={tab === a.key} onClick={() => setTab(a.key)}
                className={`${BTN} border border-[#1A1815] ${tab === a.key ? 'bg-[#1A1815] text-white' : 'text-[#1A1815]'}`}>{a.label}</button>
            ))}
          </div>

          {/* The community feed for the active view. */}
          {feed.length > 0 && (
            <div className="mt-3">
              <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold mb-1">What everyone’s watching</div>
              <ul className="space-y-0.5">
                {feed.slice(0, 6).map((f) => (
                  <li key={f.title} className="text-xs text-[#1A1815]" style={serif}>
                    <strong>{f.title}</strong> <span className="text-[#5A5751]">· {f.count} watching ({f.watchers.join(', ')})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Each member's shared shows in this view. */}
          <div className="mt-3 space-y-3">
            {buckets[tab].length === 0 && <p className="text-xs text-[#5A5751]" style={serif}>No {tab} shows shared here yet.</p>}
            {buckets[tab].map((m) => {
              const shows = m.doc && m.doc.shows ? m.doc.shows : {};
              const meta = m.doc && m.doc.custom ? m.doc.custom : {};
              const ids = Object.keys(shows);
              if (!ids.length) return null;
              return (
                <div key={`${m.owner}-${tab}`}>
                  <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">{m.name}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {ids.map((id) => <SharedShowCard key={id} title={(meta[id] && meta[id].title) || id} watched={shows[id].watched} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {msg && <p className="text-[0.6875rem] text-[#5A6E3D] mt-2" style={serif}>{msg}</p>}
    </section>
  );
}
