// =============================================================================
// ReactionKey — the discoverable LEGEND for the "Images of the Godhead" reactions.
// =============================================================================
// Darrell 2026-07-02: people need a KEY that teaches the non-standard biblical
// reaction symbols — each symbol, what it MEANS (how the Word lands), and the
// SCRIPTURE it is anchored to. This is that key.
//
// ONE SOURCE (DR-0079 / declutter): this legend renders ENTIRELY from the same
// canonical registry the picker's hover-tooltip reads — lib/reactions.js. It
// holds NO copy of its own: every label / meaning / verse is read live from
// REACTIONS. Add or reword a reaction there and this key updates by reference,
// so Help can never drift from the palette. (The picker is ReactionBar.jsx; the
// registry + Scripture are reactions.js.)
//
// PRESENTATIONAL: no data, no state — a pure render of the registry, grouped by
// The Son / The Spirit / The Father (+ the plain set). Reverent, Word-anchored,
// KJV (public domain). A11y: real headings + list semantics; icons are the
// device-independent SVG (ReactionIcon), never emoji; rem sizes scale with the
// global large-print control; verse text in the app's high-contrast tokens.
// =============================================================================
import React from 'react';
import ReactionIcon from './ReactionIcon.jsx';
import { REACTION_GROUPS, reactionsInGroup } from '../lib/reactions.js';

// One reaction row: symbol + name + how it lands + its anchoring Scripture.
function KeyRow({ r }) {
  return (
    <li className="flex gap-2.5 py-1.5">
      <span
        className="shrink-0 w-7 h-7 flex items-center justify-center border border-[#E8E4DC] bg-[#FAF8F4] text-[#B85838]"
        aria-hidden="true"
      >
        <ReactionIcon name={r.icon} title={r.label} />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            {r.label}
          </span>
          {r.receives && (
            <span className="text-[0.6875rem] text-[#5A6E3D]">how it lands: {r.receives}</span>
          )}
        </span>
        {r.scripture ? (
          <span className="block text-xs text-[#5A5751] leading-snug mt-0.5">
            <span className="italic">“{r.scripture.text}”</span>{' '}
            <span className="whitespace-nowrap text-[#1A1815]">— {r.scripture.ref} (KJV)</span>
          </span>
        ) : (
          <span className="block text-xs text-[#5A5751] italic mt-0.5">A plain reaction.</span>
        )}
      </span>
    </li>
  );
}

// The full key, grouped exactly as the picker groups (same source of order).
// `plain` — set false to show only the Godhead images (the symbols that need
// teaching); defaults true so the key mirrors the palette one-to-one.
export default function ReactionKey({ plain = true, className = '' }) {
  const groups = REACTION_GROUPS.filter((g) => plain || g.key !== 'plain');
  return (
    <div className={className} style={{ fontFamily: '"Fraunces", serif' }}>
      <p className="text-sm leading-relaxed text-[#1A1815]">
        Each reaction is an image of Yahweh — the Father, the Son, or the Holy Spirit —
        anchored to the Scripture it comes from. Tap one on any message or decision to
        say how the Word landed; the same meaning and verse you see here show on the
        picker as you hover.
      </p>
      <div className="mt-4 space-y-4">
        {groups.map((g) => {
          const items = reactionsInGroup(g.key);
          if (!items.length) return null;
          return (
            <div key={g.key}>
              <h4 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">
                {g.label}
              </h4>
              <ul className="divide-y divide-[#E8E4DC] border-t border-[#E8E4DC]">
                {items.map((r) => (
                  <KeyRow key={r.key} r={r} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
