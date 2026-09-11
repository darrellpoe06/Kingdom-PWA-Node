// =============================================================================
// ChurchMinistries — the ministries of the house, and the door into each one.
// =============================================================================
// Declared by Darrell 2026-09-11, working the app with the COLG leadership:
// "after a certain what different ministries we have and organize around that."
//
// It is the surface the room was already describing:
//   "So it looks like they've got all these different categories. They can just
//    go to the category they wanna go to... and then work that category."
//   "Now the members see bus ministry, they see different things... so I wanna
//    join the choir if I wanna do this."
//
// The list is NOT painted here — it comes from lib/church-ministries.js, the one
// registry the feedback picker and the staff ops list read too, so there is no
// second copy to go stale (the exact failure scripts/feedback-area-guard.mjs
// exists to catch).
//
// TWO HONESTIES this surface is built to keep (DR-0061 reality-trace, DR-0076):
//   1. A ministry with a page in the app SAYS SO and opens it. A ministry that
//      has no page yet says THAT, and offers the only thing that is actually
//      true today — tell us what it needs. A tile that looks like a door and
//      goes nowhere is the painted number this project refuses.
//   2. This roster is what the church has told us so far, not the whole house.
//      The surface says it in plain words rather than implying completeness.
// =============================================================================
import React, { useMemo, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import {
  CHURCH_MINISTRIES, MINISTRY_ROSTER_NOTE, matchesMinistry,
} from '../lib/church-ministries.js';

const CARD = 'border border-[#E8E4DC] bg-white p-3';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';

export function ChurchMinistries({ onOpen = null, onFeedback = null }) {
  const [query, setQuery] = useState('');
  const shown = useMemo(
    () => CHURCH_MINISTRIES.filter((m) => matchesMinistry(m, query)),
    [query],
  );
  const withPage = shown.filter((m) => m.surface);
  const namedOnly = shown.filter((m) => !m.surface);

  const tile = (m) => (
    <div key={m.id} className={`${CARD} space-y-1.5`}>
      <div className="text-sm font-medium text-[#1A1815]" style={{ fontFamily: 'Fraunces, serif' }}>{m.name}</div>
      <p className="text-xs text-[#5A5751]">{m.blurb}</p>
      <p className="text-xs text-[#1A1815]">{m.join}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        {m.surface ? (
          <button type="button" onClick={() => onOpen && onOpen(m.surface)}
            className={`${BTN} bg-[#1A1815] text-white hover:bg-[#B85838]`}>
            Open {m.name}
          </button>
        ) : (
          <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] self-center">
            No page in the app yet
          </span>
        )}
        <button type="button" onClick={() => onFeedback && onFeedback(m.feedbackKey)}
          className={`${BTN} border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white`}>
          {m.surface ? 'Tell us about it' : 'Tell us what it needs'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full p-4 space-y-3">
      <SectionTitle>Ministries</SectionTitle>
      <p className="text-xs text-[#5A5751] italic">
        &quot;And he gave some, apostles; and some, prophets; and some, evangelists; and some, pastors and teachers; For the perfecting of the saints, for the work of the ministry, for the edifying of the body of Christ.&quot; — Ephesians 4:11-12 (KJV)
      </p>

      {/* The control is sized, not the surface: tab content stretches full width
          (CONSISTENCY-STANDARD rule 1, DR-0246). */}
      <label className="block">
        <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1">Find a ministry</span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} className={`${FIELD} sm:w-80`}
          aria-label="Find a ministry by name"
          placeholder="e.g. bus, choir, band, ushers" />
      </label>

      {shown.length === 0 && (
        <p className="text-sm text-[#5A5751]">
          Nothing by that name yet. Clear the search to see them all — and if the church has a ministry that is missing here, tell us and it gets added.
        </p>
      )}

      {withPage.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[#1A1815]">In the app</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{withPage.map(tile)}</div>
        </div>
      )}

      {namedOnly.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[#1A1815]">Named, not built yet</h3>
          <p className="text-xs text-[#5A5751]">
            These are real ministries of the house with no page of their own in the app so far. Saying that plainly is the point — what each one needs is what decides which gets built next.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{namedOnly.map(tile)}</div>
        </div>
      )}

      <p className="text-xs text-[#5A5751] italic border-t border-[#E8E4DC] pt-2">{MINISTRY_ROSTER_NOTE}</p>
    </div>
  );
}

export default ChurchMinistries;
