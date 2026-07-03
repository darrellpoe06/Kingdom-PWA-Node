// =============================================================================
// ReactionBar — the reusable in-app reaction control (social-media style).
// =============================================================================
// Darrell 2026-07-01: replace the single buggy heart with a proper reaction
// control on every item — TAP opens the reaction PALETTE (the "Images of the
// Godhead" set + like/love/amen/wrestling), pick ONE, it registers; tap it again
// to remove; switching updates cleanly. Per-reaction counts show compactly; each
// reaction shows its Scripture on hover/focus (self-explaining). The SAME control
// everywhere — sermons, studies, songs, posts, and family/financial decisions.
//
// PRESENTATIONAL + content-agnostic. The surface owns the data (subscribes once,
// passes the per-item `entry` down, and handles `onReact` via reactions-sync).
// This component owns the interaction: the palette popover, the single-pick toggle
// with OPTIMISTIC feedback (instant, then reconciled by realtime), the compact
// counts, the Scripture detail, and the optional "who reacted" readout.
//
// A11y: the trigger is a real button (aria-haspopup, aria-expanded); each palette
// item is a button with a full title; Escape + outside-tap close the popover; the
// chosen reaction is aria-pressed. No emoji (device-independent SVG via
// ReactionIcon), rem font sizes (the global large-print control scales it).
//
// TOUCH-FIRST (Darrell 2026-07-03: "nice in theory, they don't feel intuitive
// yet"): every tile shows its NAME under the icon — the meaning is never hidden
// behind hover, which touch devices don't have. On a no-hover device the pick is
// TWO taps: the first shows the meaning + Scripture in the detail strip and arms
// the tile ("tap again to react"); the second confirms. Desktop keeps one-click
// (hover already previews). Nobody reacts blind, nobody reacts by accident.
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactionIcon from './ReactionIcon.jsx';
import {
  REACTION_GROUPS, reactionsInGroup, reactionDef, reactionSummary, EMPTY_REACTIONS,
} from '../lib/reactions.js';

// True when the device has a real hover (mouse/trackpad). Touch/pen-only devices
// report (hover: none) and get the two-tap flow. Environments without matchMedia
// (tests, older engines) default to hover-capable, preserving one-click.
function canHover() {
  return !(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: none)').matches);
}

// Move one vote from oldKey -> newKey in a counts map (optimistic display).
function adjustCounts(base = {}, oldKey, newKey) {
  const c = { ...base };
  if (oldKey && oldKey !== newKey) c[oldKey] = Math.max(0, (c[oldKey] || 0) - 1);
  if (newKey && newKey !== oldKey) c[newKey] = (c[newKey] || 0) + 1;
  return c;
}

export default function ReactionBar({
  entry = EMPTY_REACTIONS,
  onReact,                 // async (reactionKey) => result — parent toggles via reactions-sync
  onShowWho = null,        // optional async () => [{ reactionKey, displayName }]
  signedIn = true,
  contentLabel = 'this',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);      // the reaction whose Scripture is shown in the palette
  const [armed, setArmed] = useState(null);        // touch two-tap: the key awaiting its confirming tap
  const [pendingMy, setPendingMy] = useState(null); // optimistic: the just-picked key, '' = removed, null = none
  const [who, setWho] = useState(null);            // reactors list (when the counts row is tapped)
  const [note, setNote] = useState('');            // soft status (e.g. sign-in prompt)
  const rootRef = useRef(null);

  // Server state is the source of truth; whenever it updates, drop the optimism.
  useEffect(() => { setPendingMy(null); }, [entry]);

  // Effective (optimistic) my-pick + counts for display.
  const myKey = pendingMy !== null ? (pendingMy || null) : entry.myKey;
  const counts = pendingMy !== null ? adjustCounts(entry.counts, entry.myKey, pendingMy || null) : entry.counts;
  const summary = useMemo(() => reactionSummary({ ...entry, counts, top:
    Object.entries(counts).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count) }),
    [entry, counts]);
  const total = summary.reduce((a, s) => a + s.count, 0);
  const myDef = myKey ? reactionDef(myKey) : null;

  // Opening fresh or closing drops any half-armed pick.
  useEffect(() => { setArmed(null); setDetail(null); }, [open]);

  // Close on outside tap / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  // A tap on a palette tile. No-hover devices confirm in two taps: the first
  // arms the tile and shows its meaning (the preview hover would have given);
  // the second (same tile) reacts. Hover devices react on the single click.
  const pick = (r) => {
    if (!canHover() && armed !== r.key) {
      setDetail(r);
      setArmed(r.key);
      return;
    }
    react(r.key);
  };

  const react = async (key) => {
    if (!signedIn) { setNote('Sign in to react.'); return; }
    setNote('');
    // Optimistic: if picking my current reaction, remove it; else set it.
    const next = myKey === key ? '' : key;
    setPendingMy(next);
    setOpen(false);
    setArmed(null);
    const res = await onReact?.(key);
    if (res && res.skipped) {
      setPendingMy(null); // reconcile back to server truth
      if (res.skipped === 'signed-out') setNote('Sign in to react.');
      else if (res.skipped !== 'no-instance') setNote('Could not save your reaction.');
    }
  };

  const showWho = async () => {
    if (!onShowWho) return;
    if (who) { setWho(null); return; }
    const list = await onShowWho();
    setWho(Array.isArray(list) ? list : []);
  };

  const CHIP = 'inline-flex items-center gap-1 text-[0.6875rem] px-1.5 py-0.5 border focus:outline focus:outline-2 focus:outline-[#B85838]';

  return (
    <div ref={rootRef} className={`relative ${className}`} style={{ fontFamily: '"Fraunces", serif' }}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Trigger — my reaction, or a "React" affordance. TAP opens the palette. */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-pressed={!!myKey}
          className={`${CHIP} ${myKey ? 'bg-[#B85838] text-white border-[#B85838]' : 'border-[#5A5751] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815]'}`}
          title={myDef ? `You reacted: ${myDef.label}${myDef.scripture ? ` — ${myDef.scripture.ref}` : ''}` : `React to ${contentLabel}`}
        >
          <ReactionIcon name={myDef ? myDef.icon : 'love'} />
          <span>{myDef ? myDef.label : 'React'}</span>
        </button>

        {/* Compact per-reaction counts. Tap to see who (community-default). */}
        {summary.length > 0 && (
          <button
            type="button"
            onClick={showWho}
            className="inline-flex items-center gap-2 text-[0.6875rem] text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
            title={onShowWho ? 'See who reacted' : `${total} reaction${total === 1 ? '' : 's'}`}
            aria-expanded={!!who}
          >
            {summary.slice(0, 5).map((s) => (
              <span key={s.key} className="inline-flex items-center gap-0.5" title={s.def ? s.def.label : s.key}>
                <ReactionIcon name={s.def ? s.def.icon : 'love'} /> {s.count}
              </span>
            ))}
            {total > 0 && <span className="text-[#5A5751]">· {total}</span>}
          </button>
        )}
      </div>

      {note && <p className="text-[0.625rem] text-[#B85838] mt-1">{note}</p>}

      {/* WHO reacted (instance-member gated). */}
      {who && (
        <div className="mt-1 bg-white border border-[#E8E4DC] p-2 text-[0.6875rem] text-[#1A1815]">
          {who.length === 0 ? (
            <span className="text-[#5A5751] italic">No reactions to show yet.</span>
          ) : (
            <ul className="space-y-0.5">
              {who.map((r, i) => {
                const d = reactionDef(r.reactionKey);
                return (
                  <li key={`${r.displayName}-${i}`} className="flex items-center gap-1.5">
                    <ReactionIcon name={d ? d.icon : 'love'} className="text-[#B85838]" />
                    <span className="font-medium">{r.displayName}</span>
                    {d && <span className="text-[#5A5751]">— {d.label}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* PALETTE popover — grouped, self-explaining (hover/focus shows the verse). */}
      {open && (
        <div
          role="menu"
          aria-label={`Reactions for ${contentLabel}`}
          className="absolute z-30 mt-1 left-0 w-[19rem] bg-white border border-[#1A1815] shadow-lg p-2"
          style={{ maxWidth: '86vw', boxShadow: '0 6px 24px rgba(26,24,21,0.18)' }}
        >
          {REACTION_GROUPS.map((g) => {
            const items = reactionsInGroup(g.key);
            if (!items.length) return null;
            return (
              <div key={g.key} className="mb-1.5 last:mb-0">
                <div className="text-[0.5625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-1">{g.label}</div>
                <div className="grid grid-cols-4 gap-1">
                  {items.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      role="menuitem"
                      onClick={() => pick(r)}
                      onMouseEnter={() => setDetail(r)}
                      onFocus={() => setDetail(r)}
                      aria-pressed={myKey === r.key}
                      title={`${r.label}${r.scripture ? ` — ${r.scripture.ref}` : ''}`}
                      className={`flex flex-col items-center justify-start gap-0.5 px-1 pt-1.5 pb-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${
                        myKey === r.key ? 'bg-[#B85838] text-white border-[#B85838]'
                        : armed === r.key ? 'bg-white text-[#1A1815] border-[#B85838]'
                        : 'bg-[#FAF8F4] text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815] hover:bg-white'}`}
                    >
                      <span className="text-[1.05rem] leading-none"><ReactionIcon name={r.icon} title={r.label} /></span>
                      {/* The name is always VISIBLE — meaning never hides behind hover. */}
                      <span className="text-[0.5625rem] leading-tight text-center">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Detail strip — the focused/hovered reaction's meaning + Scripture. */}
          <div className="mt-1.5 border-t border-[#E8E4DC] pt-1.5 min-h-[3.25rem]">
            {detail ? (
              <div>
                <div className="flex items-center gap-1.5">
                  <ReactionIcon name={detail.icon} className="text-[#B85838]" />
                  <span className="text-[0.75rem] font-semibold text-[#1A1815]">{detail.label}</span>
                  {detail.receives && <span className="text-[0.625rem] text-[#5A6E3D]">· {detail.receives}</span>}
                </div>
                {detail.scripture ? (
                  <p className="text-[0.625rem] text-[#5A5751] mt-0.5">
                    <span className="italic">“{detail.scripture.text}”</span> <span className="whitespace-nowrap">— {detail.scripture.ref} (KJV)</span>
                  </p>
                ) : (
                  <p className="text-[0.625rem] text-[#5A5751] mt-0.5 italic">A plain reaction.</p>
                )}
                {armed === (detail && detail.key) && (
                  <p className="text-[0.625rem] font-semibold mt-0.5 text-[#B85838]">Tap “{detail.label}” again to react.</p>
                )}
              </div>
            ) : (
              <p className="text-[0.625rem] text-[#5A5751] italic">
                {canHover()
                  ? 'Hover a reaction to see its meaning and Scripture. Tap to react.'
                  : 'Tap a reaction once to see its meaning and Scripture — tap it again to react.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
